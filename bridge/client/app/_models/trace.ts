import {EventTypes} from "./event-types";
import {ResultTypes} from "./result-types";
import {ApprovalStates} from "./approval-states";
import {EVENT_LABELS} from "./event-labels";
import {EVENT_ICONS} from "./event-icons";
import {ProblemStates} from "./problem-states";


const DEFAULT_ICON = "information";

class Trace {
  id: string;
  shkeptncontext: string;
  source: string;
  time: Date;
  type: string;
  label: string;
  icon: string;
  image: string;
  plainEvent: string;
  data: {
    project: string;
    service: string;
    stage: string;

    image: string;
    tag: string;

    deploymentURILocal: string;
    deploymentURIPublic: string;

    deploymentstrategy: string;
    labels: Map<string, string>;
    result: string;
    teststrategy: string;

    start: Date;
    end: Date;

    canary: {
      action: string;
      value: number;
    };
    eventContext: {
      shkeptncontext: string;
      token: string;
    };
    valuesCanary: {
      image: string;
    };

    evaluationdetails: {
      indicatorResults: any;
      result: string;
      score: number;
      sloFileContent: string;
      timeEnd: Date;
      timeStart: Date;
    };

    evaluationHistory: Trace[];

    ProblemTitle: string;
    ImpactedEntity: string;
    ProblemDetails: {
      tagsOfAffectedEntities: {
        key: string;
        value: string;
      }
    };

    approval: {
      result: string;
      status: string;
    };

    Tags: string;
    State: string;
  };

  isFaulty(): string {
    let result: string = null;
    if(this.data) {
      if(this.isFailed() || (this.isProblem() && !this.isProblemResolvedOrClosed())) {
        result = this.data.stage;
      }
    }
    return result;
  }

  isWarning(): string {
    let result: string = null;
    if(this.data) {
      if(this.data.result == ResultTypes.WARNING) {
        result = this.data.stage;
      }
    }
    return result;
  }

  isSuccessful(): string {
    let result: string = null;
    if(this.data) {
      if(this.data.result == ResultTypes.PASSED || this.isApprovalFinished() && this.isApproved() || this.isProblem() && this.isProblemResolvedOrClosed() || this.isSuccessfulRemediation()) {
        result = this.data.stage;
      }
    }
    return !this.isFaulty() && result ? result : null;
  }

  public isFailed(): boolean {
    return this.data.result == ResultTypes.FAILED || this.isApprovalFinished() && this.isDeclined();
  }

  public isProblem(): boolean {
    return this.type === EventTypes.PROBLEM_DETECTED || this.type === EventTypes.PROBLEM_OPEN;
  }

  public isProblemResolvedOrClosed(): boolean {
    return this.data.State === ProblemStates.RESOLVED || this.data.State === ProblemStates.CLOSED;
  }

  public isSuccessfulRemediation(): boolean {
    return this.type === EventTypes.REMEDIATION_FINISHED && this.data.result == ResultTypes.PASSED;
  }

  public isApproval(): string {
    return this.type === EventTypes.APPROVAL_TRIGGERED ? this.data.stage : null;
  }

  private isApprovalFinished(): boolean {
    return this.type === EventTypes.APPROVAL_FINISHED;
  }

  private isApproved(): boolean {
    return this.data.approval?.result == ApprovalStates.APPROVED;
  }

  private isDeclined(): boolean {
    return this.data.approval?.result == ApprovalStates.DECLINED;
  }

  hasLabels(): boolean {
    return Object.keys(this.data.labels||{}).length > 0;
  }

  getLabel(): string {
    // TODO: use translation file
    if(!this.label) {
      if(this.isProblem() && this.isProblemResolvedOrClosed()) {
        this.label = EVENT_LABELS[EventTypes.PROBLEM_RESOLVED];
      } else {
        this.label = EVENT_LABELS[this.type] || this.type;
      }
    }

    return this.label;
  }

  getIcon() {
    if(!this.icon) {
      this.icon = EVENT_ICONS[this.type] || DEFAULT_ICON;
    }
    return this.icon;
  }

  getShortImageName() {
    if(!this.image) {
      if(this.data.image && this.data.tag)
        this.image = [this.data.image.split("/").pop(), this.data.tag].join(":");
      else if(this.data.image)
        this.image = this.data.image.split("/").pop();
      else if(this.data.valuesCanary)
        this.image = this.data.valuesCanary.image.split("/").pop();
    }

    return this.image;
  }

  getProject(): string {
    return this.data.project;
  }

  getService(): string {
    return this.data.service;
  }

  getChartLabel(): string {
    return this.data.labels?.["buildId"] ?? this.time;
  }

  static fromJSON(data: any) {
    const plainEvent = JSON.parse(JSON.stringify(data));
    return Object.assign(new this, data, { plainEvent });
  }
}

export {Trace}
