"use client";

import {
  KeyRound,
  LogOut,
  Mail,
  Palette,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import { useActionState, useState } from "react";

import { logoutAction } from "@/actions/auth";
import {
  changePasswordAction,
  deleteAccountAction,
  requestPasswordResetAction,
} from "@/actions/settings";
import { SettingsForm } from "@/components/settings/settings-form";
import { Button } from "@/components/ui/button";
import {
  ActionMessage,
  Field,
  Input,
  SubmitButton,
} from "@/components/ui/form-controls";
import { Modal } from "@/components/ui/modal";
import { cn, getInitials } from "@/lib/utils";
import type { ActionState, Profile } from "@/types/app";

const initialState: ActionState = {};

type SettingsSection = "profile" | "security" | "danger";

export function AccountSettingsModal({
  open,
  onClose,
  profile,
}: {
  open: boolean;
  onClose: () => void;
  profile: Profile;
}) {
  const [section, setSection] = useState<SettingsSection>("profile");
  const [passwordState, passwordAction] = useActionState(
    changePasswordAction,
    initialState,
  );
  const [resetState, resetAction] = useActionState(
    requestPasswordResetAction,
    initialState,
  );
  const [deleteState, deleteAction] = useActionState(
    deleteAccountAction,
    initialState,
  );
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const sections = [
    { key: "profile" as const, label: "Profiel & thema", icon: Palette },
    { key: "security" as const, label: "Beveiliging", icon: ShieldCheck },
    { key: "danger" as const, label: "Account", icon: UserRound },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title="Accountinstellingen"
      description="Persoonlijke voorkeuren, beveiliging en accountbeheer."
    >
      <div className="grid gap-6 md:grid-cols-[190px_minmax(0,1fr)]">
        <aside>
          <div className="mb-4 flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--accent)] text-xs font-semibold text-white">
              {getInitials(profile.fullName)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">
                {profile.fullName}
              </p>
              <p className="truncate text-[11px] text-slate-400">
                {profile.email}
              </p>
            </div>
          </div>

          <nav className="grid grid-cols-3 gap-1 md:grid-cols-1">
            {sections.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setSection(item.key)}
                className={cn(
                  "flex min-h-10 items-center justify-center gap-2 rounded-xl px-2 text-xs font-medium transition md:justify-start md:px-3 md:text-sm",
                  section === item.key
                    ? "bg-[color-mix(in_srgb,var(--accent)_10%,white)] text-[var(--accent)]"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800",
                )}
              >
                <item.icon className="size-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 border-t border-slate-100 pt-6 md:border-l md:border-t-0 md:pl-7 md:pt-0">
          {section === "profile" && (
            <div>
              <div className="mb-6">
                <h3 className="font-semibold text-slate-900">
                  Profiel en uitstraling
                </h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Deze instellingen zijn persoonlijk en gelden in ieder
                  huishouden.
                </p>
              </div>
              <SettingsForm profile={profile} />
            </div>
          )}

          {section === "security" && (
            <div className="space-y-5">
              <div>
                <h3 className="font-semibold text-slate-900">
                  Beveiliging
                </h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Beheer je wachtwoord en hersteltoegang tot je account.
                </p>
              </div>

              <section className="rounded-2xl border border-slate-200 p-4 sm:p-5">
                <div className="flex gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-50 text-slate-500">
                    <KeyRound className="size-4" />
                  </span>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">
                      Wachtwoord wijzigen
                    </h4>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Gebruik een uniek wachtwoord van minimaal acht tekens.
                    </p>
                  </div>
                </div>
                <form action={passwordAction} className="mt-4 space-y-4">
                  <ActionMessage
                    error={passwordState.error}
                    success={passwordState.success}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Nieuw wachtwoord"
                      error={passwordState.fieldErrors?.password?.[0]}
                    >
                      <Input
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        minLength={8}
                        required
                      />
                    </Field>
                    <Field
                      label="Herhaal wachtwoord"
                      error={
                        passwordState.fieldErrors?.passwordConfirmation?.[0]
                      }
                    >
                      <Input
                        name="passwordConfirmation"
                        type="password"
                        autoComplete="new-password"
                        minLength={8}
                        required
                      />
                    </Field>
                  </div>
                  <div className="flex justify-end">
                    <SubmitButton
                      variant="secondary"
                      pendingLabel="Wijzigen..."
                    >
                      Wachtwoord wijzigen
                    </SubmitButton>
                  </div>
                </form>
              </section>

              <section className="rounded-2xl border border-slate-200 p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-50 text-slate-500">
                      <Mail className="size-4" />
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">
                        Herstelmail sturen
                      </h4>
                      <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">
                        Stuur een beveiligde resetlink naar {profile.email}.
                      </p>
                    </div>
                  </div>
                  <form action={resetAction}>
                    <SubmitButton
                      variant="secondary"
                      pendingLabel="Versturen..."
                      className="w-full sm:w-auto"
                    >
                      Resetmail sturen
                    </SubmitButton>
                  </form>
                </div>
                <div className="mt-3">
                  <ActionMessage
                    error={resetState.error}
                    success={resetState.success}
                  />
                </div>
              </section>
            </div>
          )}

          {section === "danger" && (
            <div className="space-y-5">
              <div>
                <h3 className="font-semibold text-slate-900">
                  Accountbeheer
                </h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Beheer je sessie of verwijder je account definitief.
                </p>
              </div>

              <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div className="flex gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-50 text-slate-500">
                    <LogOut className="size-4" />
                  </span>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">
                      Uitloggen
                    </h4>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Sluit je sessie op dit apparaat.
                    </p>
                  </div>
                </div>
                <form action={logoutAction}>
                  <Button type="submit" variant="secondary">
                    Uitloggen
                  </Button>
                </form>
              </section>

              <section className="rounded-2xl border border-red-200 bg-red-50/50 p-4 sm:p-5">
                <div className="flex gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-red-100 text-red-600">
                    <Trash2 className="size-4" />
                  </span>
                  <div>
                    <h4 className="text-sm font-semibold text-red-900">
                      Account definitief verwijderen
                    </h4>
                    <p className="mt-1 text-xs leading-5 text-red-700/80">
                      Je profiel en toegang worden verwijderd. Huishoudens met
                      andere leden worden overgedragen; huishoudens zonder
                      andere leden en hun gegevens verdwijnen.
                    </p>
                  </div>
                </div>

                <form action={deleteAction} className="mt-5 space-y-4">
                  <ActionMessage
                    error={deleteState.error}
                    success={deleteState.success}
                  />
                  <Field
                    label='Typ "VERWIJDER" om te bevestigen'
                    hint="Deze handeling kan niet ongedaan worden gemaakt."
                  >
                    <Input
                      name="confirmation"
                      value={deleteConfirmation}
                      onChange={(event) =>
                        setDeleteConfirmation(event.target.value)
                      }
                      autoComplete="off"
                    />
                  </Field>
                  <div className="flex justify-end">
                    <SubmitButton
                      variant="danger"
                      pendingLabel="Account verwijderen..."
                      className={
                        deleteConfirmation !== "VERWIJDER"
                          ? "pointer-events-none opacity-50"
                          : undefined
                      }
                    >
                      Account verwijderen
                    </SubmitButton>
                  </div>
                </form>
              </section>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
