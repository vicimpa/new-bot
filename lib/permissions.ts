// import { Guild, GuildMember } from "discord.js";
import { readFile } from "fs/promises";
import { join } from "path";
import { CommandContext, SlashCommand } from "slash-create";
import yaml from "yaml";
import { client } from "~/lib/commands";
import { Logger } from "~/lib/logger";

import { main } from "./main";

interface IData {
  permissions: {
    [key: string]: Array<string>;
  },
  groups: {
    [key: string]: Array<string>;
  };
}

export async function testPermission(userId: string, permission: string) {
  const file = await readFile(join(process.cwd(), 'configs', 'permissions.yml'), 'utf-8')
    .catch(e => '');

  if (!file) return false;

  try {
    const blocks = permission.split('.');
    const guild = client.guild;
    const member = await guild.members.fetch(userId);
    const rolesId = member.roles.cache.array().map(e => e.id);
    const data = yaml.parse(file) as IData;

    const can = Object.keys(data.permissions).filter((k, i, d) => {
      const perms = data.permissions[k] || [];
      if (perms.indexOf(`-${permission}`) != -1) return false;
      if (perms.indexOf(`${permission}`) != -1) return true;
      const findPerm = perms.find(v => {
        if (v[0] == '-') v = v.substr(1);
        const blocksNow = v.split('.');

        for (let i = 0; i < blocksNow.length; i++) {
          const now = blocksNow[i];
          if (now == '*') return true;
          if (now != blocks[i]) return false;
        }

        return true;
      });
      if (!findPerm || findPerm[0] == '-') return false;
      return true;
    });

    const me = Object.keys(data.groups).filter((k, i, d) => {
      const perms = data.groups[k] || [];
      if (perms.indexOf(`-${userId}`) != -1) return false;
      if (perms.indexOf(`${userId}`) != -1) return true;

      for (let role of rolesId) {
        if (perms.indexOf(`-&${role}`) != -1) return false;
        if (perms.indexOf(`&${role}`) != -1) return true;
      }

      return false;
    });

    return !!me.find(e => can.indexOf(e) != -1);
  } catch (e) {
    Logger.log(e);
    return false;
  }
}

export const permission = (permission: string) => {
  return <T extends typeof SlashCommand>(base: T['prototype'], name: string, desc: PropertyDescriptor) => {
    const { value } = desc;

    if (typeof value == 'function')
      return {
        async value(ctx: CommandContext, ...args: any[]) {
          if (await testPermission(ctx.member.id, permission))
            return value.call(this, ctx, ...args);

          return {
            ephemeral: true,
            content: 'Вы не имеете доступа к этой команде!'
          };
        }
      };
  };
};

main(__filename, () => {
  testPermission('658403244749488177', 'generator.nick')
    .then(Logger.log)
    .catch(e => Logger.error(e));
});