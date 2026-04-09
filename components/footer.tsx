interface FooterProps {
  className?: string;
}

export function Footer({ className = '' }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`border-t py-6 ${className}`}>
      <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
        <p>© {currentYear} Trainera - Cocina Vasca</p>
        <p className="mt-2">
          <a
            href="https://taberna.trainera.com.ar"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Visitá nuestra carta
          </a>
        </p>
      </div>
    </footer>
  );
}