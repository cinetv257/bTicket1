import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardShell, organizerNav } from "@/components/bticket/DashboardShell";
import { Field, Select } from "@/components/bticket/Field";
import { RequireRole } from "@/components/bticket/RequireRole";
import { useAuth } from "@/hooks/useAuth";
import { getWallet, requestWithdrawal } from "@/lib/bticket";
import { formatBIF } from "@/lib/format";
import type { WalletDoc } from "@/lib/types";

export const Route = createFileRoute("/organisateur/retrait")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Demande de retrait — bTicket Burundi" },
      { name: "description", content: "Retirez vos revenus bTicket vers Lumicash, EcoCash ou votre compte bancaire." },
      { property: "og:title", content: "Demande de retrait — bTicket Burundi" },
      { property: "og:description", content: "Transférez votre solde organisateur en toute sécurité." },
    ],
  }),
  component: () => (
    <RequireRole role="organizer" loginPath="/organisateur/connexion">
      <Withdraw />
    </RequireRole>
  ),
});

const METHODS = ["Lumicash", "EcoCash", "BANCOBU"];
const MIN = 10000;

function Withdraw() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<WalletDoc | null>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState(METHODS[0]!);
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile) {
      getWallet(profile.id).then(setWallet);
      setAccountName(profile.fullName ?? "");
    }
  }, [profile]);

  const balance = wallet?.balance ?? 0;
  const value = Number(amount || 0);

  async function submit() {
    if (!profile) return;
    if (value < MIN) {
      toast.error(`Montant minimum : ${formatBIF(MIN)}`);
      return;
    }
    if (value > balance) {
      toast.error("Montant supérieur à votre solde disponible");
      return;
    }
    if (accountNumber.trim().length < 6 || accountName.trim().length < 3) {
      toast.error("Renseignez le numéro et le nom du compte destinataire");
      return;
    }
    setBusy(true);
    try {
      await requestWithdrawal({
        organizerId: profile.id,
        organizerName: profile.organizationName || profile.fullName,
        amount: value,
        method,
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim(),
      });
      toast.success("Demande envoyée, elle sera traitée par bTicket.");
      navigate({ to: "/organisateur/wallet" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Demande impossible");
    } finally {
      setBusy(false);
    }
  }

  return (
    <DashboardShell title="Demande de retrait" nav={organizerNav}>
      <div className="mb-4 rounded-2xl bg-surface-container-low p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">Solde disponible</p>
        <p className="text-2xl font-extrabold text-primary">{formatBIF(balance)}</p>
      </div>

      <div className="space-y-3 rounded-3xl bg-surface-container-lowest p-5 shadow-soft">
        <Field
          label="Montant (BIF)"
          value={amount}
          onChange={(v) => setAmount(v.replace(/\D/g, ""))}
          inputMode="numeric"
          placeholder="50000"
        />
        <p className="-mt-1 text-xs text-on-surface-variant">Minimum {formatBIF(MIN)}</p>
        <Select label="Méthode" value={method} onChange={setMethod} options={METHODS} />
        <Field label="Numéro de compte / téléphone" value={accountNumber} onChange={setAccountNumber} placeholder="79123456" />
        <Field label="Nom du titulaire" value={accountName} onChange={setAccountName} placeholder="Jean Ndayisenga" />
        <button
          onClick={submit}
          disabled={busy}
          className="mt-2 w-full rounded-full bg-primary py-3.5 text-sm font-extrabold text-primary-foreground shadow-soft disabled:opacity-60"
        >
          {busy ? "Envoi..." : "Envoyer la demande"}
        </button>
      </div>
    </DashboardShell>
  );
}
