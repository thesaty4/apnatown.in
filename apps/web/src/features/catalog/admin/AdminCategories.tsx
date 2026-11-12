'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import type {
  AdminCategory,
  AdminSubcategory,
  CategoryKind,
} from '@apnatown/shared/catalog';
import { Avatar } from '@apnatown/ui/data/Avatar';
import { Badge } from '@apnatown/ui/primitives/Badge';
import { Button } from '@apnatown/ui/primitives/Button';
import { Pill } from '@apnatown/ui/primitives/Pill';
import { Card } from '@apnatown/ui/cards/Card';
import { failureCode } from '../../../shared/api/result';
import { AdminFailure, Notice, isDenied, useAdmin } from '../../admin';
import { adminTreeOptions } from '../queries';
import { CategorySheet, SubcategorySheet } from './CategorySheets';
import { ActiveBadge, ReadOnlyNotice, useReadState } from './common';
import { HomeSectionEditor } from './HomeSectionEditor';

type Node = AdminCategory & { subcategories: AdminSubcategory[] };
type Editing =
  | { kind: 'category'; category?: Node }
  | { kind: 'subcategory'; category: Node; subcategory?: AdminSubcategory };

/**
 * S-ADMN-05 Categories: taxonomy tree for `catalog:view`. Main categories are
 * fixed; only a super admin sees add/edit/activate controls and the Home
 * section editor (Q-39). Filter preview (Search) and image upload (Media) are
 * not available yet and are intentionally absent.
 */
export function AdminCategories() {
  const context = useAdmin();
  const t = useTranslations('catalog.admin.categories');
  const locale = useLocale();
  const isSuper = context.me.isSuper;
  const query = useQuery(adminTreeOptions(context));
  const [kind, setKind] = useState<CategoryKind>('product');
  const [editing, setEditing] = useState<Editing>();
  const [notice, setNotice] = useState<string>();
  const tree = query.data?.items ?? [];
  const nodes = tree
    .filter((node) => node.kind === kind)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const code = query.isError ? failureCode(query.error) : undefined;
  const add = isSuper && (
    <Button
      onClick={() => {
        setNotice(undefined);
        setEditing({ kind: 'category' });
      }}
    >
      <span aria-hidden="true">＋</span>
      {t('addCategory')}
    </Button>
  );
  const state = useReadState(query, tree.length === 0, {
    title: t('emptyTitle'),
    message: t('emptyMessage'),
    action: add,
  });
  const name = (item: { nameEn: string; nameHi: string }) =>
    locale === 'hi' ? item.nameHi : item.nameEn;
  const latest = (node: Node) =>
    tree.find((item) => item.id === node.id) ?? node;
  const done = (message: string) => {
    setEditing(undefined);
    setNotice(message);
  };

  return (
    <div className="grid gap-stack-gap">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-h1">{t('title')}</h1>
        {tree.length > 0 && add}
      </div>
      {isSuper ? (
        <p className="text-text-2 [overflow-wrap:anywhere]">
          {t('superIntro')}
        </p>
      ) : (
        <ReadOnlyNotice message={t('adminIntro')} />
      )}
      <Notice message={notice} />
      {code && tree.length > 0 && !isDenied(code) && (
        <AdminFailure
          code={code}
          retry={() => void query.refetch()}
          busy={query.isFetching}
        />
      )}
      {state ?? (
        <>
          <div
            role="group"
            aria-label={t('kindLabel')}
            className="flex flex-wrap gap-2"
          >
            {(['product', 'service'] as const).map((value) => (
              <Pill
                key={value}
                label={t(value === 'product' ? 'productTab' : 'serviceTab')}
                selected={kind === value}
                onClick={() => setKind(value)}
              />
            ))}
          </div>
          {nodes.length === 0 ? (
            <p className="text-text-2">{t('emptyKind')}</p>
          ) : (
            <ul className="m-0 grid list-none gap-3 p-0 tablet:grid-cols-2">
              {nodes.map((node) => (
                <li key={node.id} className="min-w-0">
                  <CategoryCard
                    node={node}
                    isSuper={isSuper}
                    name={name}
                    onEdit={() => {
                      setNotice(undefined);
                      setEditing({ kind: 'category', category: node });
                    }}
                    onAddSub={() => {
                      setNotice(undefined);
                      setEditing({ kind: 'subcategory', category: node });
                    }}
                    onEditSub={(subcategory) => {
                      setNotice(undefined);
                      setEditing({
                        kind: 'subcategory',
                        category: node,
                        subcategory,
                      });
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
          {isSuper && <HomeSectionEditor tree={tree} />}
        </>
      )}
      {editing?.kind === 'category' && (
        <CategorySheet
          kind={editing.category?.kind ?? kind}
          category={editing.category && latest(editing.category)}
          onClose={() => setEditing(undefined)}
          onSaved={(saved) => done(t('saved', { name: name(saved) }))}
        />
      )}
      {editing?.kind === 'subcategory' && (
        <SubcategorySheet
          category={latest(editing.category)}
          subcategory={
            editing.subcategory &&
            (latest(editing.category).subcategories.find(
              (item) => item.id === editing.subcategory?.id,
            ) ??
              editing.subcategory)
          }
          onClose={() => setEditing(undefined)}
          onSaved={(saved) => done(t('subSaved', { name: name(saved) }))}
        />
      )}
    </div>
  );
}

function CategoryCard({
  node,
  isSuper,
  name,
  onEdit,
  onAddSub,
  onEditSub,
}: {
  node: Node;
  isSuper: boolean;
  name: (item: { nameEn: string; nameHi: string }) => string;
  onEdit: () => void;
  onAddSub: () => void;
  onEditSub: (subcategory: AdminSubcategory) => void;
}) {
  const t = useTranslations('catalog.admin.categories');
  const [open, setOpen] = useState(false);
  const panelId = `subcategories-${node.id}`;
  const subcategories = [...node.subcategories].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
  return (
    <Card padded className="grid h-full gap-3">
      <div className="flex items-start gap-3">
        <Avatar
          label=""
          emoji={node.icon || '🏷️'}
          {...(node.image ? { src: node.image.publicUrl } : {})}
        />
        <div className="grid min-w-0 flex-1 gap-1">
          <h2 className="text-h3 [overflow-wrap:anywhere]" lang="en">
            {node.nameEn}
          </h2>
          <p
            className="text-small text-text-2 [overflow-wrap:anywhere]"
            lang="hi"
          >
            {node.nameHi}
          </p>
          <div className="flex flex-wrap gap-2">
            <ActiveBadge active={node.active} />
            {!isSuper && <Badge tone="neutral" icon="🔒" label={t('fixed')} />}
          </div>
        </div>
      </div>
      <Button
        variant="text"
        aria-expanded={open}
        aria-controls={panelId}
        className="justify-start"
        onClick={() => setOpen((value) => !value)}
      >
        <span aria-hidden="true">{open ? '▾' : '▸'}</span>
        {t('subcategoryCount', { count: subcategories.length })}
      </Button>
      <div id={panelId} hidden={!open} className="grid gap-2">
        {subcategories.length === 0 ? (
          <p className="text-small text-text-2">{t('noSubcategories')}</p>
        ) : (
          <ul className="m-0 grid list-none gap-2 p-0">
            {subcategories.map((sub) => (
              <li
                key={sub.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-2"
              >
                <span className="grid min-w-0 flex-1">
                  <span className="[overflow-wrap:anywhere]" lang="en">
                    {sub.nameEn}
                  </span>
                  <span
                    className="text-small text-text-2 [overflow-wrap:anywhere]"
                    lang="hi"
                  >
                    {sub.nameHi}
                  </span>
                </span>
                <ActiveBadge active={sub.active} />
                {isSuper && (
                  <Button
                    variant="outline"
                    aria-label={t('editSubNamed', { name: name(sub) })}
                    onClick={() => onEditSub(sub)}
                  >
                    {t('edit')}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      {isSuper && (
        <div className="mt-auto flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="min-w-0 flex-1"
            aria-label={t('editNamed', { name: name(node) })}
            onClick={onEdit}
          >
            {t('edit')}
          </Button>
          <Button
            variant="ghost"
            className="min-w-0 flex-1"
            aria-label={t('addSubNamed', { name: name(node) })}
            onClick={onAddSub}
          >
            <span aria-hidden="true">＋</span>
            {t('addSubcategory')}
          </Button>
        </div>
      )}
    </Card>
  );
}
