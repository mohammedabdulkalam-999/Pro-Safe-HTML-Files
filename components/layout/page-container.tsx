interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={`admin-page animate-fade-in ${className ?? ""}`}>
      {children}
    </div>
  );
}
