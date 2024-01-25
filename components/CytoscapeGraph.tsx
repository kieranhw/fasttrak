import { useEffect } from 'react';
import { displayGraph } from '../utils/utils/cytoscape-data'
import { Graph } from '@/utils/routing/model/graph';
import { VRPSolution } from '@/utils/routing/model/vrp';

interface Props {
  graph: Graph;
  solution: VRPSolution;
}

export const CytoscapeGraph: React.FC<Props> = ({ graph, solution }) => {

  useEffect(() => {
      displayGraph(graph, solution);
  }, [graph, solution]);

  return (
    <div id="cy" className="w-full h-full overflow-hidden bg-card rounded-md" />
  );
};
