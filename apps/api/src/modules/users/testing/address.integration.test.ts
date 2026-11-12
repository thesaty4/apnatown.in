import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import type {
  DynamicModule,
  ExecutionContext,
  PipeTransform,
} from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { RouteParamtypes } from '@nestjs/common/enums/route-paramtypes.enum';
import { Reflector } from '@nestjs/core';
import { CreateAddressSchema } from '@apnatown/shared/users';
import { AuthGuard } from '../../../shared/auth/auth.guard';
import { SessionCookie } from '../../../shared/auth/cookie';
import { CsrfSynchronizer } from '../../../shared/auth/csrf';
import type { AuthRequest } from '../../../shared/auth';
import type { RuntimeConfig } from '../../../shared/config/config';
import { withCorrelation } from '../../../shared/logger/context';
import type { SessionService } from '../../auth/application/session.service';
import { AuthController } from '../../auth/presentation/auth.controller';
import { UsersController } from '../presentation/users.controller';
import { AddressesController } from '../presentation/addresses.controller';
import { addressFixture, hasCode } from './address.fixture';
import { AppModule } from '../../../app.module';
import { COMMAND_UNIT_OF_WORK } from '../../../shared/persistence/ports';
import { PrismaCommandUnitOfWork } from '../../../shared/persistence/command-unit-of-work';

test('Composition shares one runtime/Geo instance and binds the real command UoW', () => {
  // Inspect metadata only: no Nest bootstrap, cleanup timer, connection or server.
  const root = AppModule.forRoot({ APP_ENV: 'test' } as RuntimeConfig);
  const [runtime, auth, geo] = root.imports as DynamicModule[];
  assert.equal(auth!.imports![0], runtime);
  const users = auth!.imports![1] as DynamicModule;
  assert.equal(users.imports![0], runtime);
  assert.equal(users.imports![1], geo);
  assert.equal(geo!.imports![0], runtime);
  assert.ok(
    runtime!.providers!.some(
      (provider) =>
        typeof provider === 'object' &&
        'provide' in provider &&
        provider.provide === COMMAND_UNIT_OF_WORK &&
        'useExisting' in provider &&
        provider.useExisting === PrismaCommandUnitOfWork,
    ),
  );
});

function queryPipe(controller: object, method: string): PipeTransform {
  const metadata = Reflect.getMetadata(
    ROUTE_ARGS_METADATA,
    controller,
    method,
  ) as Record<string, { pipes: PipeTransform[] }>;
  const entry = Object.entries(metadata).find(([key]) =>
    key.startsWith(`${RouteParamtypes.QUERY}:`),
  );
  assert.ok(entry, `${method} must own a query DTO`);
  return entry[1].pipes[0]!;
}

test('Existing Auth/profile handlers retain strict empty queries; addresses alone accept pagination', () => {
  for (const [controller, methods] of [
    [AuthController, ['csrf', 'challenge', 'verify', 'session', 'logout']],
    [
      UsersController,
      ['profile', 'updateProfile', 'preferences', 'updatePreferences'],
    ],
    [AddressesController, ['create', 'update', 'delete']],
  ] as const) {
    for (const method of methods) {
      const pipe = queryPipe(controller, method);
      assert.deepEqual(pipe.transform({}, { type: 'query' }), {});
      assert.throws(
        () => pipe.transform({ limit: '1' }, { type: 'query' }),
        hasCode('VALIDATION_ERROR'),
      );
      assert.throws(
        () => pipe.transform({ userId: randomUUID() }, { type: 'query' }),
        hasCode('VALIDATION_ERROR'),
      );
    }
  }
  assert.deepEqual(
    queryPipe(AddressesController, 'list').transform(
      { limit: '1' },
      { type: 'query' },
    ),
    { limit: 1 },
  );
});

test('Real AuthGuard preserves authentication, CSRF and no-store while presentation owns queries', async () => {
  const h = addressFixture();
  const config = {
    WEB_ORIGIN: 'https://synthetic.example.invalid',
  } as RuntimeConfig;
  const sessions = {
    async resolve() {
      return h.state.live
        ? {
            session: { ...h.session, kind: 'authenticated' },
            principal: h.state.principal,
          }
        : null;
    },
  } as unknown as SessionService;
  const guard = new AuthGuard(
    new Reflector(),
    sessions,
    new SessionCookie(config),
    new CsrfSynchronizer(),
    config,
  );
  const headers = new Map<string, string>();
  const request = {
    method: 'GET',
    query: { limit: '1' },
    headers: {},
    cookies: {},
  } as unknown as AuthRequest;
  const context = {
    getClass: () => AddressesController,
    getHandler: () =>
      request.method === 'GET'
        ? AddressesController.prototype.list
        : AddressesController.prototype.create,
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({
        setHeader: (key: string, value: string) => headers.set(key, value),
      }),
    }),
  } as unknown as ExecutionContext;
  assert.equal(await guard.canActivate(context), true);
  assert.equal(headers.get('Cache-Control'), 'private, no-store');
  assert.equal(request.principal?.userId, h.userId);
  h.state.live = false;
  await assert.rejects(guard.canActivate(context), hasCode('SESSION_EXPIRED'));
  h.state.live = true;
  request.method = 'POST';
  request.headers.origin = config.WEB_ORIGIN;
  await assert.rejects(guard.canActivate(context), hasCode('CSRF_INVALID'));
  request.headers['x-csrf-token'] = h.session.csrfToken;
  assert.equal(await guard.canActivate(context), true);
  request.headers.origin = 'https://attacker.example.invalid';
  await assert.rejects(guard.canActivate(context), hasCode('CSRF_INVALID'));
});

test('Controller, address use-case and Geo owner port integrate with isolated repositories and original replay DTOs', async () => {
  const h = addressFixture();
  const controller = new AddressesController(h.service);
  const request = {
    authSession: h.session,
    principal: h.state.principal,
    headers: { 'idempotency-key': randomUUID() },
  } as unknown as AuthRequest;
  await withCorrelation('address-integration', async () => {
    const input = CreateAddressSchema.parse(h.input);
    const created = await controller.create(request, {}, input);
    assert.deepEqual(await controller.create(request, {}, input), created);
    const page = await controller.list(request, { limit: 1 });
    assert.deepEqual(page.items, [created]);
    request.headers['idempotency-key'] = randomUUID();
    const edited = await controller.update(
      request,
      {},
      { addressId: created.id },
      { expectedVersion: 1, isDefault: true },
    );
    assert.equal(edited.isDefault, true);
    assert.deepEqual(
      await controller.update(
        request,
        {},
        { addressId: created.id },
        { expectedVersion: 1, isDefault: true },
      ),
      edited,
    );
    request.headers['idempotency-key'] = randomUUID();
    const deleted = await controller.delete(
      request,
      {},
      { addressId: created.id },
      { expectedVersion: 2 },
    );
    assert.equal(deleted.version, 3);
    assert.deepEqual(
      await controller.delete(
        request,
        {},
        { addressId: created.id },
        { expectedVersion: 2 },
      ),
      deleted,
    );
    h.state.active = false;
    await assert.rejects(
      controller.delete(
        request,
        {},
        { addressId: created.id },
        { expectedVersion: 2 },
      ),
      hasCode('ACCOUNT_UNAVAILABLE'),
    );
  });
});
