import 'react-native-get-random-values';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { ConnectionProvider } from './components/ConnectionProvider';
import { AuthorizationProvider } from './components/AuthProvider';
import { clusterApiUrl } from '@solana/web3.js';
import { MainScreen } from './screens/MainScreen';
import { NFTProvider } from './components/NFTProvider';
global.Buffer = require('buffer').Buffer;

export default function App() {
  // const cluster = "localhost" as any;
  // const endpoint = 'http://10.0.2.2:8899';
  const cluster = "devnet";
  const endpoint = clusterApiUrl(cluster);

  return (
    <ConnectionProvider
      endpoint={endpoint}
      cluster={cluster}
      config={{ commitment: "processed" }}
    >
      <AuthorizationProvider cluster={cluster}>
        <NFTProvider>
          <MainScreen/>
        </NFTProvider>
      </AuthorizationProvider>
    </ConnectionProvider>
  );
}