import {Stage} from "./stage";
import {Service} from "./service";
import {Trace} from "./trace";
import {EventTypes} from "./event-types";
import {Root} from "./root";

export class Project {
  projectName: string;
  gitUser: string;
  gitRemoteURI: string;
  gitToken: string;

  stages: Stage[];
  services: Service[];

  getServices(): Service[] {
    if(!this.services) {
      this.services = [];
      this.stages.forEach((stage: Stage) => {
        this.services = this.services.concat(stage.services.filter(s => !this.services.some(ss => ss.serviceName == s.serviceName)));
      });
    }
    return this.services;
  }

  getService(serviceName: string): Service {
    return this.getServices().find(s => s.serviceName == serviceName);
  }

  getStage(stageName: string): Stage {
    return this.stages.find(s => s.stageName == stageName);
  }

  getLatestDeployment(service: Service, stage: Stage): Trace {
    let currentService = this.getService(service.serviceName);

    if(currentService.roots)
      return currentService.roots
        .filter(root => root.isFaulty() != stage.stageName || root.traces.find(trace => trace.type == EventTypes.DEPLOYMENT_FINISHED && trace.data.stage == stage.stageName)?.data.deploymentstrategy == "direct")
        .reduce((traces: Trace[], root) => [...traces, ...root.traces], [])
        .find(trace => trace.type == EventTypes.DEPLOYMENT_FINISHED && trace.data.stage == stage.stageName);
    else
      return null;
  }

  getRootEvent(service: Service, event: Trace): Root {
    return service.roots.find(root => root.shkeptncontext == event.shkeptncontext);
  }

  getDeploymentEvaluation(trace: Trace): Trace {
    let service = this.getServices().find(s => s.serviceName == trace.data.service);
    let root = this.getRootEvent(service, trace);
    return root.traces.slice().reverse().find(t => t.type == EventTypes.EVALUATION_DONE);
  }

  static fromJSON(data: any) {
    return Object.assign(new this, data);
  }
}
