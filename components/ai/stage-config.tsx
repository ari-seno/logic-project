"use client";

import type { ReactNode } from "react";

import { RequirementsSuggestion } from "@/components/ai/requirements-suggestion";
import { DecisionsSuggestion } from "@/components/ai/decisions-suggestion";
import { DomainsSuggestion } from "@/components/ai/domains-suggestion";
import { ArchitectureSuggestion } from "@/components/ai/architecture-suggestion";
import { ApiSuggestion } from "@/components/ai/api-suggestion";
import { TasksSuggestion } from "@/components/ai/tasks-suggestion";
import { UiSuggestion } from "@/components/ai/ui-suggestion";
import { UiDetailSuggestion } from "@/components/ai/ui-detail-suggestion";
import {
  AI_STAGE_LABELS,
  type AiStageLabels,
} from "@/components/ai/stage-labels";
import {
  aiApplyApi,
  aiApplyUi,
  aiApplyUiDetail,
  aiApplyArchitecture,
  aiApplyDecisions,
  aiApplyDomains,
  aiApplyRequirements,
  aiApplyTasks,
  aiSuggestApi,
  aiSuggestUi,
  aiSuggestUiDetail,
  aiSuggestArchitecture,
  aiSuggestDecisions,
  aiSuggestDomains,
  aiSuggestRequirements,
  aiSuggestTasks,
} from "@/lib/ai/actions";
import type {
  AiApiItem,
  AiTaskItem,
  AiApplyResult,
  AiArchitectureItem,
  AiDecisionItem,
  AiErdDomainItem,
  AiRequirementItem,
  AiUiItem,
  AiUiDetailItem,
  SuggestResult,
} from "@/lib/ai/schema";
import type { AiStage } from "@/lib/ai/stages";

export type AiSuggestionItem =
  | AiRequirementItem
  | AiDecisionItem
  | AiErdDomainItem
  | AiArchitectureItem
  | AiApiItem
  | AiUiItem
  | AiUiDetailItem;

export type SuggestionListProps = {
  items: AiSuggestionItem[];
  selectedIndices: Set<number>;
  onToggle: (index: number) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
  showIndex: boolean;
};

export type AiStageUiConfig = {
  labels: AiStageLabels;
  renderItems: (props: SuggestionListProps) => ReactNode;
  suggest: (input: {
    projectId: string;
    prompt: string;
  }) => Promise<SuggestResult<AiSuggestionItem>>;
  apply: (input: {
    suggestionId: string;
    indices: number[];
  }) => Promise<AiApplyResult>;
};

export const AI_STAGE_UI: Record<AiStage, AiStageUiConfig> = {
  requirements: {
    labels: AI_STAGE_LABELS.requirements,
    renderItems: (props) => (
      <RequirementsSuggestion
        items={props.items as AiRequirementItem[]}
        selectedIndices={props.selectedIndices}
        onToggle={props.onToggle}
        onSelectAll={props.onSelectAll}
        onSelectNone={props.onSelectNone}
        showIndex={props.showIndex}
      />
    ),
    suggest: aiSuggestRequirements,
    apply: aiApplyRequirements,
  },
  decisions: {
    labels: AI_STAGE_LABELS.decisions,
    renderItems: (props) => (
      <DecisionsSuggestion
        items={props.items as AiDecisionItem[]}
        selectedIndices={props.selectedIndices}
        onToggle={props.onToggle}
        onSelectAll={props.onSelectAll}
        onSelectNone={props.onSelectNone}
        showIndex={props.showIndex}
      />
    ),
    suggest: aiSuggestDecisions,
    apply: aiApplyDecisions,
  },
  domains: {
    labels: AI_STAGE_LABELS.domains,
    renderItems: (props) => (
      <DomainsSuggestion
        items={props.items as AiErdDomainItem[]}
        selectedIndices={props.selectedIndices}
        onToggle={props.onToggle}
        onSelectAll={props.onSelectAll}
        onSelectNone={props.onSelectNone}
        showIndex={props.showIndex}
      />
    ),
    suggest: aiSuggestDomains,
    apply: aiApplyDomains,
  },
  architecture: {
    labels: AI_STAGE_LABELS.architecture,
    renderItems: (props) => (
      <ArchitectureSuggestion
        items={props.items as AiArchitectureItem[]}
        selectedIndices={props.selectedIndices}
        onToggle={props.onToggle}
        onSelectAll={props.onSelectAll}
        onSelectNone={props.onSelectNone}
        showIndex={props.showIndex}
      />
    ),
    suggest: aiSuggestArchitecture,
    apply: aiApplyArchitecture,
  },
  api: {
    labels: AI_STAGE_LABELS.api,
    renderItems: (props) => (
      <ApiSuggestion
        items={props.items as AiApiItem[]}
        selectedIndices={props.selectedIndices}
        onToggle={props.onToggle}
        onSelectAll={props.onSelectAll}
        onSelectNone={props.onSelectNone}
        showIndex={props.showIndex}
      />
    ),
    suggest: aiSuggestApi,
    apply: aiApplyApi,
  },
  ui: {
    labels: AI_STAGE_LABELS.ui,
    renderItems: (props) => (
      <UiSuggestion
        items={props.items as AiUiItem[]}
        selectedIndices={props.selectedIndices}
        onToggle={props.onToggle}
        onSelectAll={props.onSelectAll}
        onSelectNone={props.onSelectNone}
        showIndex={props.showIndex}
      />
    ),
    suggest: aiSuggestUi,
    apply: aiApplyUi,
  },
  "ui-detail": {
    labels: AI_STAGE_LABELS["ui-detail"],
    renderItems: (props) => (
      <UiDetailSuggestion
        items={props.items as unknown as AiUiDetailItem[]}
        selectedIndices={props.selectedIndices}
        onToggle={props.onToggle}
        onSelectAll={props.onSelectAll}
        onSelectNone={props.onSelectNone}
        showIndex={props.showIndex}
      />
    ),
    suggest: aiSuggestUiDetail as unknown as AiStageUiConfig["suggest"],
    apply: aiApplyUiDetail,
  },
  tasks: {
    labels: AI_STAGE_LABELS.tasks,
    renderItems: (props) => (
      <TasksSuggestion
        items={props.items as unknown as AiTaskItem[]}
        selectedIndices={props.selectedIndices}
        onToggle={props.onToggle}
        onSelectAll={props.onSelectAll}
        onSelectNone={props.onSelectNone}
        showIndex={props.showIndex}
      />
    ),
    suggest: aiSuggestTasks as unknown as AiStageUiConfig["suggest"],
    apply: aiApplyTasks,
  },
};
