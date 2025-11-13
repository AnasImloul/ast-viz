import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, GripVertical, Hash, Type, Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type ChipType = 'rule' | 'literal' | 'pattern' | 'operator' | 'builtin';

interface RuleChipProps {
  id: string;
  value: string;
  type: ChipType;
  draggable?: boolean;
  onRemove?: () => void;
  onEdit?: () => void;
  description?: string;
}

const chipStyles = {
  rule: 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100',
  literal: 'bg-green-100 dark:bg-green-900 border-green-300 dark:border-green-700 text-green-900 dark:text-green-100',
  pattern: 'bg-purple-100 dark:bg-purple-900 border-purple-300 dark:border-purple-700 text-purple-900 dark:text-purple-100',
  operator: 'bg-orange-100 dark:bg-orange-900 border-orange-300 dark:border-orange-700 text-orange-900 dark:text-orange-100',
  builtin: 'bg-teal-100 dark:bg-teal-900 border-teal-300 dark:border-teal-700 text-teal-900 dark:text-teal-100',
};

const chipIcons = {
  rule: Code2,
  literal: Type,
  pattern: Hash,
  operator: Hash,
  builtin: Hash,
};

export const RuleChip: React.FC<RuleChipProps> = ({
  id,
  value,
  type,
  draggable = true,
  onRemove,
  onEdit,
  description,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled: !draggable,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = chipIcons[type];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border-2
        font-mono text-xs transition-all
        ${chipStyles[type]}
        ${isDragging ? 'shadow-lg cursor-grabbing' : 'shadow-sm'}
        ${draggable ? 'cursor-grab hover:shadow-md' : ''}
        group
      `}
      title={description}
    >
      {draggable && (
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing focus:outline-none"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-3 w-3 opacity-50 group-hover:opacity-100" />
        </button>
      )}
      
      <Icon className="h-3 w-3 flex-shrink-0" />
      
      <span
        className="font-medium select-none"
        onClick={onEdit}
        role={onEdit ? 'button' : undefined}
      >
        {value}
      </span>

      {onRemove && (
        <Button
          size="icon"
          variant="ghost"
          onClick={onRemove}
          className="h-4 w-4 p-0 hover:bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Remove"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};

interface StaticRuleChipProps {
  value: string;
  type: ChipType;
  description?: string;
  onClick?: () => void;
}

export const StaticRuleChip: React.FC<StaticRuleChipProps> = ({
  value,
  type,
  description,
  onClick,
}) => {
  const Icon = chipIcons[type];

  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border-2
        font-mono text-xs transition-all shadow-sm
        ${chipStyles[type]}
        hover:shadow-md hover:scale-105 active:scale-95
        cursor-pointer
      `}
      title={description}
    >
      <Icon className="h-3 w-3" />
      <span className="font-medium">{value}</span>
    </button>
  );
};

