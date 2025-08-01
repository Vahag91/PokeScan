import Ionicons from 'react-native-vector-icons/Ionicons';

export default function getTabIcon(routeName, color, size) {
  switch (routeName) {
    case 'Collections':
      return <Ionicons name="folder-open" size={size} color={color} />;
    case 'Search':
      return <Ionicons name="search" size={size} color={color} />;
    case 'Scan':
      return <Ionicons name="scan" size={size} color={color} />;
    case 'Sets':
      return <Ionicons name="albums" size={size} color={color} />;
    default:
      return <Ionicons name="home" size={size} color={color} />;
  }
}