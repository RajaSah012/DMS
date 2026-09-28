import React from 'react';
import { ProjectGrid } from './ProjectGrid';

export const FolderGrid = (props) => {
  return <ProjectGrid onOpenCreateProject={props.onOpenCreateFolder} {...props} />;
};
