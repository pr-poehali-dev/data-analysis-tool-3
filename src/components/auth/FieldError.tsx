interface FieldErrorProps {
  id: string;
  message?: string;
}

export const FieldError = ({ id, message }: FieldErrorProps) => {
  if (!message) return null;

  return (
    <p id={id} role="alert" className="text-xs text-destructive">
      {message}
    </p>
  );
};
