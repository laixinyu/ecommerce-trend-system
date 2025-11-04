import { createClient } from '@/lib/supabase/server';
import { ModuleConfig, ModuleStatus } from '@/types/modules';
import { MODULE_REGISTRY, getModuleById } from './module-registry';

export class ModuleManager {
  // Get user's module settings from database
  static async getUserModuleSettings(userId: string): Promise<Record<string, any>> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('user_settings')
      .select('module_settings')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return {};
    }

    return data.module_settings || {};
  }

  // Update user's module settings
  static async updateModuleSettings(
    userId: string,
    moduleId: string,
    settings: Record<string, any>
  ): Promise<void> {
    const supabase = await createClient();
    
    const currentSettings = await this.getUserModuleSettings(userId);
    const updatedSettings = {
      ...currentSettings,
      [moduleId]: {
        ...currentSettings[moduleId],
        ...settings,
      },
    };

    await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        module_settings: updatedSettings,
        updated_at: new Date().toISOString(),
      });
  }

  // Enable a module for user
  static async enableModule(userId: string, moduleId: string): Promise<void> {
    await this.updateModuleSettings(userId, moduleId, {
      enabled: true,
      enabledAt: new Date().toISOString(),
    });
  }

  // Disable a module for user
  static async disableModule(userId: string, moduleId: string): Promise<void> {
    await this.updateModuleSettings(userId, moduleId, {
      enabled: false,
      disabledAt: new Date().toISOString(),
    });
  }

  // Get module status for user
  static async getModuleStatus(
    userId: string,
    moduleId: string
  ): Promise<ModuleStatus> {
    const supabase = await createClient();
    const module = getModuleById(moduleId);
    
    if (!module) {
      throw new Error(`Module ${moduleId} not found`);
    }

    const settings = await this.getUserModuleSettings(userId);
    const moduleSettings = settings[moduleId] || {};
    
    // Check if module has required integrations
    let health: 'healthy' | 'warning' | 'error' = 'healthy';
    let errorMessage: string | undefined;

    if (module.requiredIntegrations && module.requiredIntegrations.length > 0) {
      const { data: integrations } = await supabase
        .from('integrations')
        .select('service_name, status')
        .eq('user_id', userId)
        .eq('status', 'active');

      const activeIntegrations = integrations?.map((i) => i.service_name) || [];
      const missingIntegrations = module.requiredIntegrations.filter(
        (req) => !activeIntegrations.includes(req)
      );

      if (missingIntegrations.length > 0) {
        health = 'warning';
        errorMessage = `缺少必需的集成: ${missingIntegrations.join(', ')}`;
      }
    }

    return {
      moduleId,
      status: moduleSettings.enabled !== false ? 'enabled' : 'disabled',
      health,
      lastCheck: new Date().toISOString(),
      errorMessage,
    };
  }

  // Get all module statuses for user
  static async getAllModuleStatuses(userId: string): Promise<ModuleStatus[]> {
    const statuses: ModuleStatus[] = [];
    
    for (const module of MODULE_REGISTRY) {
      const status = await this.getModuleStatus(userId, module.id);
      statuses.push(status);
    }

    return statuses;
  }

  // Get modules with their user-specific settings
  static async getModulesForUser(userId: string): Promise<ModuleConfig[]> {
    const settings = await this.getUserModuleSettings(userId);
    
    return MODULE_REGISTRY.map((module) => {
      const userSettings = settings[module.id] || {};
      return {
        ...module,
        status: userSettings.enabled !== false ? 'enabled' : 'disabled',
        settings: userSettings,
      };
    });
  }

  // Toggle module feature
  static async toggleFeature(
    userId: string,
    moduleId: string,
    featureId: string,
    enabled: boolean
  ): Promise<void> {
    const settings = await this.getUserModuleSettings(userId);
    const moduleSettings = settings[moduleId] || {};
    const features = moduleSettings.features || {};

    await this.updateModuleSettings(userId, moduleId, {
      ...moduleSettings,
      features: {
        ...features,
        [featureId]: enabled,
      },
    });
  }
}
