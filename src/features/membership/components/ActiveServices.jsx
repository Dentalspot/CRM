import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertCircle, Shield } from 'lucide-react';
import { PLAN_FEATURES, PLAN_NAMES } from '../api/membershipApi';
import { FEATURE_DISPLAY_CONFIG } from './membershipConfig';

const ActiveServices = ({ planName }) => {
  const features = PLAN_FEATURES[planName] || PLAN_FEATURES[PLAN_NAMES.FREE];

  const activeFeatures = Object.entries(features)
    .filter(([key, value]) => value === true && FEATURE_DISPLAY_CONFIG[key])
    .map(([key]) => ({ key, ...FEATURE_DISPLAY_CONFIG[key] }));

  const limitedFeatures = Object.entries(features)
    .filter(([key, value]) => value === 'limited' && FEATURE_DISPLAY_CONFIG[key])
    .map(([key]) => ({ key, ...FEATURE_DISPLAY_CONFIG[key] }));

  const blockedFeatures = Object.entries(features)
    .filter(([key, value]) => value === false && FEATURE_DISPLAY_CONFIG[key])
    .slice(0, 4)
    .map(([key]) => ({ key, ...FEATURE_DISPLAY_CONFIG[key] }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" /> Servicios de tu Plan
        </CardTitle>
        <CardDescription>Funcionalidades incluidas en tu suscripción actual</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" /> Activos ({activeFeatures.length})
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {activeFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.key} className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-100">
                    <Icon className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700 font-medium">{feature.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {limitedFeatures.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500" /> Limitados ({limitedFeatures.length})
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {limitedFeatures.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <div key={feature.key} className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-100">
                      <Icon className="h-4 w-4 text-amber-600" />
                      <span className="text-sm text-amber-700 font-medium">{feature.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {blockedFeatures.length > 0 && planName !== PLAN_NAMES.CENTER && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <XCircle className="h-4 w-4 text-gray-400" /> Desbloquea con upgrade
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {blockedFeatures.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <div key={feature.key} className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 border border-gray-200 opacity-60">
                      <Icon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-500">{feature.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActiveServices;
