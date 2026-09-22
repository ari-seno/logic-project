"use client";

import type { ReactNode } from "react";

import { RequirementsSuggestion } from "@/components/ai/requirements-suggestion";
import { DecisionsSuggestion } from "@/components/ai/decisions-suggestion";
import { DomainsSuggestion } from "@/components/ai/domains-suggestion";
import {
  AI_STAGE_LABELS,
  type AiStageLabels,
} from "@/components/ai/stage-labels";
import {
  aiApplyDecisions,
  aiApplyDomains,
  aiApplyRequirements,
  aiSuggestDecisions,
  aiSuggestDomains,
  aiSuggestRequirements,
} from "@/lib/ai/actions";
import type {
  AiApplyResult,
  AiDecisionItem,
  AiErdDomainItem,
  AiRequirementItem,
  SuggestResult,
} from "@/lib/ai/schema";
import type { AiStage } from "@/lib/ai/stages";

export type AiSuggestionItem =
  | AiRequirementItem
  | AiDecisionItem
  | AiErdDomainItem;

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
};
