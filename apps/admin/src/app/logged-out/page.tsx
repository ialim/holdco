export default function LoggedOutPage() {
  return (
    <main style={{ padding: 32, fontFamily: "Segoe UI, sans-serif" }}>
      <h1>Signed out</h1>
      <p>You have been signed out of HoldCo Admin.</p>
      <p>
        <a href="/">Return to sign in</a>
      </p>
    </main>
  );
}
