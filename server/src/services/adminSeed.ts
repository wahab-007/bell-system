import { OrganisationModel } from '../models/Organisation';
import { UserModel } from '../models/User';
import { hashPassword } from '../utils/password';

const DEFAULT_ADMIN_EMAIL = 'admin@admin.com';
const DEFAULT_ADMIN_PASSWORD = 'admin';

export const ensureDefaultAdmin = async () => {
  let adminOrg = await OrganisationModel.findOne({ slug: 'admin' });
  if (!adminOrg) {
    adminOrg = await OrganisationModel.create({
      name: 'Admin',
      slug: 'admin',
      timezone: 'UTC',
      contactEmail: DEFAULT_ADMIN_EMAIL,
    });
  }

  const existingAdmin = await UserModel.findOne({ email: DEFAULT_ADMIN_EMAIL });
  if (existingAdmin) return;

  const password = await hashPassword(DEFAULT_ADMIN_PASSWORD);
  await UserModel.create({
    organisation: adminOrg._id,
    name: 'System Admin',
    email: DEFAULT_ADMIN_EMAIL,
    password,
    role: 'superadmin',
  });
};
