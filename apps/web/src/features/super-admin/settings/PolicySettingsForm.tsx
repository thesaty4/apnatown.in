'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type {
  SettingValue,
  SuperAdminSettings,
} from '@apnatown/shared/settings';
import { Button } from '@apnatown/ui/primitives/Button';
import { Chip } from '@apnatown/ui/primitives/Chip';
import { Input } from '@apnatown/ui/primitives/Input';
import { TextArea } from '@apnatown/ui/primitives/TextArea';
import {
  FormCard,
  textOf,
  toNumber,
  useSectionForm,
  type Issues,
} from './form';
import { UploadPoliciesCard } from './UploadPoliciesCard';

type Form = {
  refundWindowHours: string;
  ruleEn: string;
  ruleHi: string;
  blockedWords: string[];
};
const keys = ['policies', 'reviews'] as const;

function toForm(values: { policies?: unknown; reviews?: unknown }): Form {
  const policies = values.policies as SettingValue<'policies'> | null;
  const reviews = values.reviews as SettingValue<'reviews'> | null;
  return {
    refundWindowHours: textOf(policies?.refundWindowHours),
    ruleEn: reviews?.ruleEn ?? '',
    ruleHi: reviews?.ruleHi ?? '',
    blockedWords: reviews?.blockedWords ?? [],
  };
}

function toValues(form: Form, issues: Issues) {
  return {
    policies: {
      refundWindowHours: toNumber(
        form.refundWindowHours,
        'policies.refundWindowHours',
        issues,
      ),
    },
    reviews: {
      ruleEn: form.ruleEn,
      ruleHi: form.ruleHi,
      blockedWords: form.blockedWords,
    },
  };
}

/** Refund window + review rules: one atomic `policies_reviews` save. Rule copy
 * is guidance only; Reviews' eligibility gates are enforced server-side. */
function PolicySettingsForm({ data }: { data: SuperAdminSettings }) {
  const t = useTranslations('superAdmin.settings.policies');
  const tf = useTranslations('superAdmin.settings');
  const [word, setWord] = useState('');
  const section = useSectionForm({
    id: 'policies_reviews',
    data,
    keys,
    group: 'policies_reviews',
    toForm,
    toValues,
  });
  const { form, change, has } = section;
  const addWord = () => {
    const value = word.trim();
    if (!value) return;
    if (
      !form.blockedWords.some(
        (item) => item.toLowerCase() === value.toLowerCase(),
      )
    )
      change((current) => ({
        ...current,
        blockedWords: [...current.blockedWords, value],
      }));
    setWord('');
  };
  return (
    <FormCard
      title={tf('sections.policies')}
      section={section}
      rules={(path) =>
        path.startsWith('reviews.blockedWords')
          ? t('blockedWordsRule')
          : undefined
      }
    >
      <Input
        label={t('refundWindow')}
        inputMode="numeric"
        required
        value={form.refundWindowHours}
        error={
          has('policies.refundWindowHours') ? tf('errors.field') : undefined
        }
        onChange={(event) =>
          change((current) => ({
            ...current,
            refundWindowHours: event.target.value,
          }))
        }
      />
      <div className="grid gap-3 tablet:grid-cols-2">
        {(['ruleEn', 'ruleHi'] as const).map((name) => (
          <TextArea
            key={name}
            label={t(name)}
            lang={name === 'ruleHi' ? 'hi' : 'en'}
            rows={3}
            maxLength={500}
            required
            value={form[name]}
            error={has(`reviews.${name}`) ? tf('errors.text') : undefined}
            onChange={(event) =>
              change((current) => ({ ...current, [name]: event.target.value }))
            }
          />
        ))}
      </div>
      <fieldset className="grid gap-2">
        <legend className="mb-2 text-h4">{t('blockedWords')}</legend>
        {form.blockedWords.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {form.blockedWords.map((item) => (
              <li key={item}>
                <Chip
                  label={item}
                  removable
                  removeLabel={t('removeWord', { word: item })}
                  onRemove={() =>
                    change((current) => ({
                      ...current,
                      blockedWords: current.blockedWords.filter(
                        (value) => value !== item,
                      ),
                    }))
                  }
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-small text-muted">{t('noBlockedWords')}</p>
        )}
        <div className="flex flex-wrap items-end gap-2">
          <Input
            label={t('addWord')}
            wrapperClassName="min-w-0 flex-1"
            maxLength={50}
            value={word}
            onChange={(event) => setWord(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addWord();
              }
            }}
          />
          <Button type="button" variant="outline" onClick={addWord}>
            {tf('add')}
          </Button>
        </div>
      </fieldset>
    </FormCard>
  );
}

export function PolicySettings({ data }: { data: SuperAdminSettings }) {
  return (
    <div className="grid gap-4">
      <PolicySettingsForm data={data} />
      <UploadPoliciesCard data={data} />
    </div>
  );
}
