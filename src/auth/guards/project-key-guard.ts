import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ProjectsService } from '../../projects/projects.service';

@Injectable()
export class ProjectKeyGuard implements CanActivate {
  constructor(private projectsService: ProjectsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const projectKey =
      request.headers['x-project-key'] || request.params.projectKey;

    if (!projectKey) {
      throw new UnauthorizedException('Project key is required');
    }

    // Verify the project key exists and is valid
    const project = await this.projectsService.findByKey(projectKey);

    if (!project || project.isArchived) {
      throw new UnauthorizedException('Invalid or inactive project key');
    }

    // Attach project to request for later use
    request.project = project;

    return true;
  }
}
