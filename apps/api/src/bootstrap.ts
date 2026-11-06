import 'dotenv/config';
import argon2 from 'argon2';
import { db } from './core';

async function main() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !password || password.length < 12) {
    throw new Error('Set BOOTSTRAP_ADMIN_EMAIL and a unique BOOTSTRAP_ADMIN_PASSWORD of at least 12 characters.');
  }
  const alreadyExists = await db.adminUser.count();
  if (alreadyExists) throw new Error('Admin users already exist. Bootstrap is only for the first account.');
  const permissions = [
    'book.read', 'book.write', 'book.publish', 'book.delete', 'author.read', 'author.write',
    'category.read', 'category.write', 'home.manage', 'banner.manage',
    'media.read', 'media.write', 'search.manage', 'settings.update', 'user.manage',
    'role.manage', 'audit.view',
  ];
  await db.$transaction(async (tx) => {
    const passwordHash = await argon2.hash(password);
    // Create all permissions in one operation
    await tx.permission.createMany({
      data: permissions.map((key) => ({
        key,
        resource: key.split('.')[0],
        action: key.split('.')[1]
      }))
    });

    // Create Super Admin and connect permissions
    const role = await tx.role.create({
      data: {
        key: 'super_admin',
        name: 'Super administrator',
        protected: true,
        permissions: {
          connect: permissions.map((key) => ({
            key
          }))
        }
      }
    });
    const roleKeys: Record<string, string[]> = {
      catalogue_editor: ['book.read', 'book.write', 'book.publish', 'author.read', 'author.write', 'category.read', 'category.write', 'media.read', 'media.write'],
      content_manager: ['book.read', 'category.read', 'home.manage', 'banner.manage', 'media.read', 'media.write', 'search.manage', 'settings.update'],
      viewer: ['book.read', 'author.read', 'category.read', 'media.read'],
    };
    for (const [key, keys] of Object.entries(roleKeys)) {
      await tx.role.create({ data: { key, name: key.replace('_', ' '),
        permissions: { connect: keys.map((name) => ({ key: name })) } } });
    }
    await tx.adminUser.create({ data: {
      name: process.env.BOOTSTRAP_ADMIN_NAME || 'Administrator', email,
      passwordHash, roles: { connect: { id: role.id } },
    } });
  });
  console.log('Initial administrator created. Remove bootstrap credentials from your environment.');
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; })
  .finally(() => db.$disconnect());
