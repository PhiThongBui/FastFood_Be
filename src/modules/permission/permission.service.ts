import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Permission, PermissionGroup } from '@/models';
import { DEFAULT_PERMISSION_GROUPS } from './permission-catalog.defaults';

export interface PermissionOptionDto {
  value: string;
  label: string;
  description: string | null;
}

export interface PermissionGroupDto {
  key: string;
  label: string;
  description: string | null;
  permissions: PermissionOptionDto[];
}

@Injectable()
export class PermissionService implements OnApplicationBootstrap {
  constructor(
    @InjectModel(PermissionGroup)
    private readonly permissionGroupModel: typeof PermissionGroup,
    @InjectModel(Permission)
    private readonly permissionModel: typeof Permission,
  ) {}

  async onApplicationBootstrap() {
    await this.seedDefaultPermissionCatalog();
  }

  async getPermissionGroups(): Promise<PermissionGroupDto[]> {
    await this.seedDefaultPermissionCatalog();

    const [groups, permissions] = await Promise.all([
      this.permissionGroupModel.findAll({
        where: { isActive: true },
        order: [
          ['sortOrder', 'ASC'],
          ['label', 'ASC'],
        ],
      }),
      this.permissionModel.findAll({
        where: { isActive: true },
        order: [
          ['groupKey', 'ASC'],
          ['sortOrder', 'ASC'],
          ['label', 'ASC'],
        ],
      }),
    ]);

    const permissionsByGroup = permissions.reduce<
      Record<string, PermissionOptionDto[]>
    >((accumulator, item) => {
      const permission = item.get({ plain: true });
      const groupPermissions = accumulator[permission.groupKey] || [];
      groupPermissions.push({
        value: permission.value,
        label: permission.label,
        description: permission.description,
      });
      accumulator[permission.groupKey] = groupPermissions;
      return accumulator;
    }, {});

    return groups.map((item) => {
      const group = item.get({ plain: true });

      return {
        key: group.key,
        label: group.label,
        description: group.description,
        permissions: permissionsByGroup[group.key] || [],
      };
    });
  }

  async getActivePermissionValues() {
    await this.seedDefaultPermissionCatalog();

    const permissions = await this.permissionModel.findAll({
      where: { isActive: true },
      attributes: ['value'],
    });

    return permissions.map((permission) => permission.value);
  }

  private async seedDefaultPermissionCatalog() {
    for (const [groupIndex, group] of DEFAULT_PERMISSION_GROUPS.entries()) {
      await this.permissionGroupModel.findOrCreate({
        where: { key: group.key },
        defaults: {
          key: group.key,
          label: group.label,
          description: group.description,
          sortOrder: groupIndex,
          isActive: true,
        },
      });

      for (const [permissionIndex, permission] of group.permissions.entries()) {
        await this.permissionModel.findOrCreate({
          where: { value: permission.value },
          defaults: {
            value: permission.value,
            groupKey: group.key,
            label: permission.label,
            description: permission.description,
            sortOrder: permissionIndex,
            isActive: true,
          },
        });
      }
    }
  }
}
