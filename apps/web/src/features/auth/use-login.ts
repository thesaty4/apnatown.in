'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { skipToken, useQuery } from '@tanstack/react-query';
import { ChallengeInputSchema, VerifyInputSchema } from '@apnatown/shared/auth';
import { useSession } from '../../shared/auth/SessionProvider';
import { landing } from '../../shared/auth/return-to';
import { failureCode } from '../../shared/api/result';
import { accountScope, queryKeys } from '../../shared/api/query-keys';
import { usePrivateMutation } from '../../shared/api/use-private-mutation';
import { applyPreferences } from '../../shared/i18n/browser-preferences';
import { preferencesOptions } from '../../shared/i18n/preferences-api';
import { requestChallenge, verifyChallenge } from './api';

export function useLogin(returnTo?: string) {
  const { api, signedIn, refresh, state, epoch, lifecycle } = useSession();
  const locale = useLocale() === 'hi' ? 'hi' : 'en';
  const [phone, setPhone] = useState('');
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [validationError, setValidationError] = useState<string>();
  const [verifiedEpoch, setVerifiedEpoch] = useState<number>();
  const [verified, setVerified] = useState(false);
  const currentVerification = verified && verifiedEpoch === epoch;
  const challengeMutation = usePrivateMutation(
    lifecycle,
    (phone: string, guard) => requestChallenge(api, phone, guard),
  );
  const verifyMutation = usePrivateMutation(
    lifecycle,
    (input: { challengeId: string; code: string }, guard) =>
      verifyChallenge(api, input, guard),
  );
  const preferences = useQuery({
    ...(state.kind === 'ready'
      ? preferencesOptions(api, accountScope(state.data, epoch), lifecycle)
      : {
          queryKey: queryKeys.pendingPreferences(epoch),
          queryFn: skipToken,
        }),
    enabled: currentVerification && state.kind === 'ready',
  });
  useEffect(
    () =>
      lifecycle.subscribe(() => {
        setPhone('');
        setDigits(Array(6).fill(''));
        setValidationError(undefined);
        setVerifiedEpoch(undefined);
      }),
    [lifecycle],
  );
  useEffect(() => {
    if (
      !currentVerification ||
      state.kind !== 'ready' ||
      !preferences.isSuccess
    )
      return;
    // Effects cannot replay a command; this is navigation after confirmed reads.
    lifecycle.assert(epoch);
    applyPreferences(preferences.data);
    const destination = landing(
      state.data,
      returnTo,
      preferences.data.locale ?? locale,
    );
    window.location.replace(
      `/account/profile?${new URLSearchParams({ onboarding: '1', returnTo: destination })}`,
    );
  }, [
    currentVerification,
    state,
    preferences.isSuccess,
    preferences.data,
    returnTo,
    locale,
    lifecycle,
    epoch,
  ]);

  const challenge = challengeMutation.data;
  const busy = challengeMutation.isPending || verifyMutation.isPending;
  const error =
    validationError ??
    (verifyMutation.isError ? failureCode(verifyMutation.error) : undefined) ??
    (challengeMutation.isError
      ? failureCode(challengeMutation.error)
      : undefined) ??
    (state.kind === 'error' &&
    (verified || (epoch > 0 && state.code !== 'SESSION_CHANGED'))
      ? state.code
      : undefined) ??
    (verified && preferences.isError
      ? failureCode(preferences.error)
      : undefined) ??
    (verified && !currentVerification && state.kind === 'ready'
      ? 'SESSION_CHANGED'
      : undefined);

  function clearError() {
    setValidationError(undefined);
    verifyMutation.reset();
    if (challengeMutation.isError) challengeMutation.reset();
  }
  function requestCode() {
    if (busy) return;
    clearError();
    if (!ChallengeInputSchema.safeParse({ phone }).success) {
      setValidationError('PHONE_INVALID');
      return;
    }
    void challengeMutation.run(phone, () => setDigits(Array(6).fill('')));
  }
  function verify() {
    if (busy) return;
    clearError();
    const code = digits.join('');
    if (!challenge || !VerifyInputSchema.safeParse({ code }).success) {
      setValidationError('CODE_INCOMPLETE');
      return;
    }
    // Clear OTP from editable state immediately; variables never enter Query.
    setDigits(Array(6).fill(''));
    void verifyMutation.run(
      { challengeId: challenge.challengeId, code },
      () => {
        verifyMutation.reset();
        challengeMutation.reset();
        setPhone('');
        // signedIn fences the previous context synchronously, then revalidates via Query.
        void signedIn();
        setVerified(true);
        setVerifiedEpoch(lifecycle.snapshot());
      },
    );
  }
  function changeNumber() {
    if (busy) return;
    challengeMutation.reset();
    setDigits(Array(6).fill(''));
    clearError();
  }
  return {
    phone,
    setPhone,
    challenge,
    digits,
    setDigits,
    error,
    busy,
    verified,
    clearError,
    requestCode,
    verify,
    changeNumber,
    finish: () => {
      // Read-only recovery never submits verification again.
      if (state.kind !== 'ready')
        void refresh().then((result) => {
          if (result.kind === 'ready') setVerifiedEpoch(lifecycle.snapshot());
        });
      else {
        setVerifiedEpoch(epoch);
        void preferences.refetch();
      }
    },
  };
}
