import { Context, Scenes } from 'telegraf';
import { User } from '@prisma/client';

export interface KudiMataContext extends Context {
    scene: Scenes.SceneContextScene<KudiMataContext, Scenes.WizardSessionData>;
    wizard: Scenes.WizardContextWizard<KudiMataContext>;
    state: {
        user?: User;
    };
}
