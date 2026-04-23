import { AuthForm } from "@/components/auth-form";

export default function AuthPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-10 px-6 py-10 text-[#EEEDFE]">
        <section className="grid gap-6 rounded-2xl bg-[#1A1535] p-8 md:grid-cols-2">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold">Sign Up / Sign In</h1>
            <p className="text-[#AFA9EC]">
              A 6-digit code will be sent to your email for verification. Sign in with your email and password.
            </p>
          </div>
          <AuthForm />
        </section>

        <section className="rounded-2xl bg-[#0A0A18] p-8">
          <h2 className="text-2xl font-bold">Subscription Plans</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 p-4">Free</div>
            <div className="rounded-xl border border-[#7F77DD] p-4">Basic (4,900 KRW)</div>
            <div className="rounded-xl border border-[#AFA9EC] p-4">Pro (9,900 KRW)</div>
          </div>
        </section>

        <section className="rounded-2xl bg-[#1A1535] p-8">
          <h2 className="text-2xl font-bold">My Page</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-[#26215C] p-4">Saved Films</div>
            <div className="rounded-lg bg-[#26215C] p-4">Vote History</div>
            <div className="rounded-lg bg-[#26215C] p-4">Subscription Status</div>
          </div>
        </section>
    </div>
  );
}
