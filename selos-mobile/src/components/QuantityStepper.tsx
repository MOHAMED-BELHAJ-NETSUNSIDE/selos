import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus } from 'lucide-react';

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
}

export function QuantityStepper({ 
  value, 
  onChange, 
  min = 0, 
  max,
  disabled = false,
  className = ''
}: QuantityStepperProps) {
  const handleDecrease = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrease = () => {
    if (!max || value < max) {
      onChange(value + 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value) || min;
    if (newValue >= min && (!max || newValue <= max)) {
      onChange(newValue);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={handleDecrease}
        disabled={disabled || value <= min}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <Input
        type="number"
        value={value}
        onChange={handleInputChange}
        min={min}
        max={max}
        disabled={disabled}
        className="flex-1 text-center"
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={handleIncrease}
        disabled={disabled || (max !== undefined && value >= max)}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

