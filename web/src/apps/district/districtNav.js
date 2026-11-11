import {
  BookOpen,
  Building2,
  Clock,
  GraduationCap,
  LayoutDashboard,
  LayoutGrid,
  LineChart,
  School,
  Shield,
  Users,
} from 'lucide-react';

/** District home — dashboard + school directory. */
export const districtHomeNav = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, type: 'link' },
  { id: 'schools', name: 'Schools', icon: School, type: 'link' },
  { id: 'apps', name: 'Apps', icon: LayoutGrid, type: 'link' },
  { id: 'insights', name: 'Insights', icon: LineChart, type: 'link' },
  { id: 'admin-access', name: 'App Access', icon: Shield, type: 'link' },
];

/** Inside a school — sidebar swaps to this workspace. Staff is first. */
export const districtSchoolNav = [
  { id: 'staff', name: 'Staff', icon: Users, type: 'link' },
  { id: 'departments', name: 'Departments', icon: Building2, type: 'link' },
  { id: 'classes', name: 'Classes', icon: BookOpen, type: 'link' },
  { id: 'students', name: 'Students', icon: GraduationCap, type: 'link' },
  { id: 'schedule', name: 'Schedule', icon: Clock, type: 'link' },
  { id: 'access', name: 'Access', icon: Shield, type: 'link' },
];
