import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Teacher Portal - Dr U Education',
  description: 'Teacher dashboard and portal for Dr U Education platform',
};

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
