import { useGameStore } from './store/gameStore';
import { HomeScreen } from './components/screens/HomeScreen';
import { MemberSelectScreen } from './components/screens/MemberSelectScreen';
import { ProjectScreen } from './components/screens/ProjectScreen';
import { ResultScreen } from './components/screens/ResultScreen';
import { CollectionScreen } from './components/screens/CollectionScreen';

function App() {
  const screen = useGameStore(s => s.screen);

  switch (screen) {
    case 'home':         return <HomeScreen />;
    case 'member_select': return <MemberSelectScreen />;
    case 'project':      return <ProjectScreen />;
    case 'result':       return <ResultScreen />;
    case 'collection':   return <CollectionScreen />;
    default:             return <HomeScreen />;
  }
}

export default App;
