import { Footer } from "./_components/footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children} <Footer />
    </>
  );
}
