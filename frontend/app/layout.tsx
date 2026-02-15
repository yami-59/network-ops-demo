import Providers from "@/components/Providers";
import AppShell from "@/components/AppShell";

export const metadata = { title: "Network Ops Demo" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
