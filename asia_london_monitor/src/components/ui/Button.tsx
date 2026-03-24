import { ButtonHTMLAttributes } from "react";

export function Button(props: ButtonHTMLAttributes<HTMLButtonElement>): JSX.Element {
  const { className = "", ...rest } = props;
  return (
    <button
      className={`bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 px-4 py-2 rounded font-medium ${className}`}
      {...rest}
    />
  );
}
