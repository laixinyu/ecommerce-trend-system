'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';

export interface WizardStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<WizardStepProps>;
}

export interface WizardStepProps {
  onNext: (data?: any) => void;
  onBack: () => void;
  data: any;
}

interface IntegrationWizardProps {
  steps: WizardStep[];
  onComplete: (data: any) => void;
  onCancel: () => void;
}

export function IntegrationWizard({ steps, onComplete, onCancel }: IntegrationWizardProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [wizardData, setWizardData] = useState<any>({});

  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  const handleNext = (stepData?: any) => {
    // Save step data
    setWizardData({ ...wizardData, ...stepData });
    setCompletedSteps(new Set([...completedSteps, currentStepIndex]));

    if (isLastStep) {
      onComplete({ ...wizardData, ...stepData });
    } else {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const StepComponent = currentStep.component;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.has(index);
          const isCurrent = index === currentStepIndex;
          const isAccessible = index <= currentStepIndex;

          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <button
                  onClick={() => isAccessible && setCurrentStepIndex(index)}
                  disabled={!isAccessible}
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-medium
                    transition-colors
                    ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isCurrent
                        ? 'bg-primary text-primary-foreground'
                        : isAccessible
                        ? 'bg-muted text-muted-foreground hover:bg-muted/80'
                        : 'bg-muted text-muted-foreground opacity-50'
                    }
                  `}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </button>
                <div className="mt-2 text-center">
                  <div
                    className={`text-sm font-medium ${
                      isCurrent ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {step.title}
                  </div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-2 ${
                    isCompleted ? 'bg-green-500' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{currentStep.title}</CardTitle>
              <CardDescription className="mt-2">{currentStep.description}</CardDescription>
            </div>
            <Badge variant="outline">
              步骤 {currentStepIndex + 1} / {steps.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <StepComponent onNext={handleNext} onBack={handleBack} data={wizardData} />
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={isFirstStep ? onCancel : handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {isFirstStep ? '取消' : '上一步'}
        </Button>
        <div className="text-sm text-muted-foreground">
          {currentStepIndex + 1} / {steps.length}
        </div>
      </div>
    </div>
  );
}
