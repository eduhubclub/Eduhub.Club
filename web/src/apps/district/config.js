import { DistrictApp } from './DistrictApp';
import { districtHomeNav, districtSchoolNav } from './districtNav';

export { districtHomeNav, districtSchoolNav };

/**
 * DistrictHub — admin dashboard and schools. Opening a school is its own workspace
 * (schedule, students, staff). Teachers can browse with lighter access.
 */
export const districtApp = {
  id: 'district',
  name: 'DistrictHub',
  themeKey: 'District',
  defaultView: 'Dashboard',
  about: {
    description:
      'DistrictHub for leaders — customize a home dashboard, manage schools, and open each building as its own workspace for schedule, students, and staff.',
    features: [
      'Customizable admin dashboard',
      'Schools directory for the district',
      'School workspace: schedule, students, staff',
      'Leadership roles from superintendent to coaches and department leads',
      'Teachers can browse schools with lighter access to their own building',
    ],
  },
  nav: districtHomeNav,
  schoolNav: districtSchoolNav,
  View: DistrictApp,
};
