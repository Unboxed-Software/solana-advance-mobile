# Notes

- Java version 11 (openjdk 11.0.20.1 2023-08-24)
- https://developer.android.com/studio
- if you’re running on a mac - you’ll need to run:
    
    ```bash
    git clone https://github.com/Unboxed-Software/solana-mobile-counter.git
    cd solana-mobile-counter
    npm install
    cd android/
    chmod +x gradlew
    cd ..
    npm run android
    ```
    

# Lesson

---
title: Basic React Native
objectives:
- Explain the...
- Explain how...
- Use...
---

# TL;DR

- …
- ….
- …

# Overview

## Topic

### Subtopic

## Conclusion

# Lab

Today we're building the Mint-A-Day app, where users will able to mint a single NFT snapshot of their lives daily, creating a permanent diary of sorts.

We will be building this with React Native and Expo. Expo is a set of tools built around React Native that will make our lives easier when dealing with device-related packages, like using the camera. To mint the NFTs we will be using Metaplex's Javascript SDK along with [nft.storage](https://nft.storage/) to store images and metadata. All of our on-chain work will be on Devnet.


### 1. Prerequisites
This lab builds off the previous two mobile lessons. This means we'll need the following:
1. A working React Native dev environment complete with an emulator (or physical device)
2. A working wallet connected to Devnet installed on your emulator

If you've completed the previous two lessons, feel free to skip steps one and two below.

1. **Set Up React Native Dev Environment** 

You'll need React Native installed on your machine as well as a running emulator or physical device. [You can accomplish this all with the React Native quickstart](https://reactnative.dev/docs/environment-setup?guide=native). 

>Note: Even though we are using Expo, you'll need to follow the react native cli guide.
>Note: If you are running an emulator, it is highly recommend to use a newer phone version to emulate along with providing several GB of RAM for it to run. We use 5GB of ram on our side. 

2. **Download and Install Solana Wallet**

You'll need a wallet that supports Devnet to test with. In [lesson 2](./TODO) we created one of these, let's install it from the solution branch.

```bash
git clone https://github.com/Unboxed-Software/react-native-fake-solana-wallet
cd react-native-fake-solana-wallet
git checkout solution
npm i
npm run install
```

The wallet should be installed on your emulator or device. Make sure to open the newly installed wallet and airdrop yourself some SOL.

3. **Sign up for EAS account and install the CLI**
  
We are using Expo. To simplify the process, you'll want an [Expo Application Services (EAS) account](https://expo.dev/). This will help you build and run the application anywhere. 

Now, install the `eas-cli` and log in:

```bash
npm install --global eas-cli
eas login
```

4. **Get an NFT.Storage API key**

We'll be using NFT.storage to host our NFTs with IPFS since they do this for free. [Sign up, and create an API key](https://nft.storage/manage/). Keep this API key private. We'll put this into a `.env` file later.

### 2. Create the app scaffold

We'll be using Expo to build and run our app. However, since the `@solana-mobile/mobile-wallet-adapter-protocol` package includes native code, we need to make some minor modifications to the traditional Expo build command. We'll be using the [method described in the Solana mobile docs](https://docs.solanamobile.com/react-native/expo#running-the-app).

We’ll first build the app, and then separately run our development client. You can do this locally or use an Expo account to have them build it for you. We will be using the local option. Feel free to [follow Solana Mobile’s guide](https://docs.solanamobile.com/react-native/expo#local-vs-eas-builds) if you want to have Expo build the app for you.

Let’s create our app with the following:
`npx create-expo-app -t expo-template-blank-typescript solana-expo`

This uses `create-expo-app` to generate a new scaffold for us based on the `expo-template-blank-typescript` template. This is just an empty Typescript React Native app.

### 3. Install dependencies

Before we build the app for the first time, let's set up our dependencies.We'll break this list into two: 
1. Basic Solana dependencies that are likely to be needed by all Solana mobile apps
2. Additional dependencies that are specific to our app

Both of these lists will include polyfills that allow otherwise incompatible packages to work with React native. If you're not familiar with polyfills, take a look at the [MDN docs](https://developer.mozilla.org/en-US/docs/Glossary/Polyfill). In short, polyfills actively replace Node-native libraries to make them work anywhere Node is not running.

Basic Solana dependencies include the following:

- `@solana-mobile/mobile-wallet-adapter-protocol`: A React Native/Javascript API enabling interaction with MWA-compatible wallets.
- `@solana-mobile/mobile-wallet-adapter-protocol-web3js`: A convenience wrapper to use common primitives from [@solana/web3.js](https://github.com/solana-labs/solana-web3.js) – such as `Transaction` and `Uint8Array`.
- `@solana/web3.js`: Solana Web Library for interacting with Solana network through the [JSON RPC API](https://docs.solana.com/api/http).
- `react-native-get-random-values`: Secure random number generator polyfill for `web3.js` underlying Crypto library on React Native.
- `buffer`: Buffer polyfill needed for `web3.js` on React Native.

Additional dependencies include the following:

- `@metaplex-foundation/js`: Allows us to easily create and fetch NFTs. At the time of writing, you need to use version 0.19.x for everything to work properly.
- Various polyfills that are needed to make the Metaplex package work, including:
  - `assert`
  - `util`
  - `crypto-browserify`
  - `stream-browserify`
  - `readable-stream`
  - `browserify-zlib`
  - `path-browserify`
  - `react-native-url-polyfill`
- `rn-fetch-blob`: Helps turn device images to blobs we can upload to [NFT.storage](https://nft.storage). 

Make sure you install all of the above. You can do this with the following command:
```bash
npm install \
  @solana/web3.js \
  @solana-mobile/mobile-wallet-adapter-protocol-web3js \
  @solana-mobile/mobile-wallet-adapter-protocol \
  react-native-get-random-values \
  buffer \
	assert \
  util \
  crypto-browserify \
  stream-browserify \
  readable-stream \
  browserify-zlib \
  path-browserify \
  react-native-url-polyfill \
  @metaplex-foundation/js@0.19.4 \
  rn-fetch-blob
```

We will finish setting up the polyfills in a later step. 

### 4. Install Expo dependencies

Before continuing, we need to install the Expo-specific dependencies we'll be using. One of the primary reasons we're using Expo is that it provides convenient interfaces for utilizing the phone's hardware. We'll be using Expo's image picker API. This lets us use the device's camera to take pictures that we'll subsequently turn into NFTs.

Install the dependency now using the following command:

```bash
npx expo install expo-image-picker
```

Next, configure the new plugin in `app.json`:
```json
  "expo": {
    // ....
    "plugins": [
      [
        "expo-image-picker",
        {
          "photosPermission": "Allows you to use images to create solana NFTs"
        }
      ]
    ],
    // ....
  }
```

***NOTE*** Every time you add in new dependencies, you'll have to build and re-install the app. Anything visual or logic-based should be captured by the hot-reloader.

### 5. Set up environment variables

To use NFT.Storage we need to import our API key. API keys should always be kept secure. Never upload them to a public directory.

Best practices suggest keeping them in a `.env` file with `.env` added to your `.gitignore`. It's also a good idea to create a `.env.example` file that can be committed to your repo and shows what environment variables are needed for the project.

Create both files, in the root of your directory and add `.env` to your `.gitignore` file.

Then, add your API key to the `.env` file with the name `EXPO_PUBLIC_NFT_STORAGE_API`. Now you'll be able to access your API key safely in the application. 

### 6. Final preparations and first build
We're very close to being able to build.

First, we'll need to log into EAS if you aren't already logged in:
```bash
eas login
```

Then create a file called `eas.json` in the root of your directory. This file will contain instructions needed for building locally.
```bash
touch eas.json
```

Copy and paste the following into the newly created `eas.json`:
```json
{
  "cli": {
    "version": ">= 5.2.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
```

Finally, we need to resolve our polyfills from before. We do that in a new file `metro.config.js`:
```bash
touch metro.config.js
```

Copy and paste the following into `metro.config.js`:
```js
/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 * @format
 */

// Import the default Expo Metro config
const { getDefaultConfig } = require('@expo/metro-config');

// Get the default Expo Metro configuration
const defaultConfig = getDefaultConfig(__dirname);

// Customize the configuration to include your extra node modules
defaultConfig.resolver.extraNodeModules = {
  crypto: require.resolve('crypto-browserify'),
  stream: require.resolve('readable-stream'),
  url: require.resolve('react-native-url-polyfill'),
  zlib: require.resolve('browserify-zlib'),
  path: require.resolve('path-browserify'),
};

// Export the modified configuration
module.exports = defaultConfig;
```


Then build the project. You will choose `y` for every answer. This will take a while to complete.

```bash
npx eas build --profile development --platform android --local
```

When it is done, you will get an output file at the root of your directory. This file will have a naming format of `build-XXXXXXXXXXX.apk`. Locate this file in your file explorer and ***drag it*** into your emulator. A message should show on the emulator saying that it is installing the new APK. When it finishes installing, you should see the APK as an app icon in the emulator.

The app that was installed is just a scaffold app from Expo. The last thing you'll need to do is run the following command to build and deploy on your emulator:

```bash
npx expo start --dev-client --android
```

This should open and run the app in your Android emulator. If you run into problems, check to make sure you’ve accomplished everything in the Prerequisites section.

### 7. Solana Boilerplate

Create two new folders `components` and `screens`.

We are going to use some boilerplate code from the first Mobile lesson, we will be copying over `components/AuthProvider.tsx` and `components/ConnectionProvider/tsx`. All these files do is provide us with a `Connection` object as well as some helper functions authorizing our dapp.

`components/AuthProvider.tsx`:
```tsx
import {Cluster, PublicKey} from '@solana/web3.js';
import {
  Account as AuthorizedAccount,
  AuthorizationResult,
  AuthorizeAPI,
  AuthToken,
  Base64EncodedAddress,
  DeauthorizeAPI,
  ReauthorizeAPI,
} from '@solana-mobile/mobile-wallet-adapter-protocol';
import {toUint8Array} from 'js-base64';
import {useState, useCallback, useMemo, ReactNode} from 'react';
import React from 'react';

export const AppIdentity = {
  name: 'Mint-A-Day',
};

export const AuthUtils = {
  getAuthorizationFromAuthResult: (
    authResult: AuthorizationResult,
    previousAccount?: Account,
  ): Authorization => {
    let selectedAccount: Account;
    if (
      //no wallet selected yet
      previousAccount == null ||
      //the selected wallet is no longer authorized
      !authResult.accounts.some(
        ({address}) => address === previousAccount.address,
      )
    ) {
      const firstAccount = authResult.accounts[0];
      selectedAccount = AuthUtils.getAccountFromAuthorizedAccount(firstAccount);
    } else {
      selectedAccount = previousAccount;
    }
    return {
      accounts: authResult.accounts.map(
        AuthUtils.getAccountFromAuthorizedAccount,
      ),
      authToken: authResult.auth_token,
      selectedAccount,
    };
  },

  getAccountFromAuthorizedAccount: (
    authAccount: AuthorizedAccount,
  ): Account => {
    return {
      ...authAccount,
      publicKey: AuthUtils.getPublicKeyFromAddress(authAccount.address),
    };
  },

  getPublicKeyFromAddress: (address: Base64EncodedAddress) => {
    return new PublicKey(toUint8Array(address));
  },
};

export type Account = Readonly<{
  address: Base64EncodedAddress;
  label?: string;
  publicKey: PublicKey;
}>;

type Authorization = Readonly<{
  accounts: Account[];
  authToken: AuthToken;
  selectedAccount: Account;
}>;

export type AuthorizationProviderContext = {
  accounts: Account[] | null;
  authorizeSession: (wallet: AuthorizeAPI & ReauthorizeAPI) => Promise<Account>;
  deauthorizeSession: (wallet: DeauthorizeAPI) => void;
  onChangeAccount: (nextSelectedAccount: Account) => void;
  selectedAccount: Account | null;
};

const AuthorizationContext = React.createContext<AuthorizationProviderContext>({
  accounts: null,
  authorizeSession: (_wallet: AuthorizeAPI & ReauthorizeAPI) => {
    throw new Error('Provider not initialized');
  },
  deauthorizeSession: (_wallet: DeauthorizeAPI) => {
    throw new Error('Provider not initialized');
  },
  onChangeAccount: (_nextSelectedAccount: Account) => {
    throw new Error('Provider not initialized');
  },
  selectedAccount: null,
});

export type AuthProviderProps = {
  children: ReactNode;
  cluster: Cluster;
};

export function AuthorizationProvider(props: AuthProviderProps) {
  const {children, cluster} = {...props};
  const [authorization, setAuthorization] = useState<Authorization | null>(
    null,
  );

  const handleAuthorizationResult = useCallback(
    async (authResult: AuthorizationResult): Promise<Authorization> => {
      const nextAuthorization = AuthUtils.getAuthorizationFromAuthResult(
        authResult,
        authorization?.selectedAccount,
      );
      setAuthorization(nextAuthorization);

      return nextAuthorization;
    },
    [authorization, setAuthorization],
  );

  const authorizeSession = useCallback(
    async (wallet: AuthorizeAPI & ReauthorizeAPI) => {
      const authorizationResult = await (authorization
        ? wallet.reauthorize({
            auth_token: authorization.authToken,
            identity: AppIdentity,
          })
        : wallet.authorize({cluster, identity: AppIdentity}));
      return (await handleAuthorizationResult(authorizationResult))
        .selectedAccount;
    },
    [authorization, handleAuthorizationResult],
  );

  const deauthorizeSession = useCallback(
    async (wallet: DeauthorizeAPI) => {
      if (authorization?.authToken == null) {
        return;
      }

      await wallet.deauthorize({auth_token: authorization.authToken});
      setAuthorization(null);
    },
    [authorization, setAuthorization],
  );

  const onChangeAccount = useCallback(
    (nextAccount: Account) => {
      setAuthorization(currentAuthorization => {
        if (
          //check if the account is no longer authorized
          !currentAuthorization?.accounts.some(
            ({address}) => address === nextAccount.address,
          )
        ) {
          throw new Error(`${nextAccount.address} is no longer authorized`);
        }

        return {...currentAuthorization, selectedAccount: nextAccount};
      });
    },
    [setAuthorization],
  );

  const value = useMemo(
    () => ({
      accounts: authorization?.accounts ?? null,
      authorizeSession,
      deauthorizeSession,
      onChangeAccount,
      selectedAccount: authorization?.selectedAccount ?? null,
    }),
    [authorization, authorizeSession, deauthorizeSession, onChangeAccount],
  );

  return (
    <AuthorizationContext.Provider value={value}>
      {children}
    </AuthorizationContext.Provider>
  );
}

export const useAuthorization = () => React.useContext(AuthorizationContext);
```

`components/ConnectionProvider/tsx`:
```tsx
import {Cluster, Connection, ConnectionConfig, clusterApiUrl} from '@solana/web3.js';
import React, {ReactNode, createContext, useContext, useMemo} from 'react';

export interface ConnectionProviderProps {
  children: ReactNode;
  cluster: Cluster;
  endpoint?: string;
  config?: ConnectionConfig;
}

export interface ConnectionContextState {
  connection: Connection;
  cluster: Cluster;
}

const ConnectionContext = createContext<ConnectionContextState>(
  {} as ConnectionContextState,
);

export function ConnectionProvider(props: ConnectionProviderProps){
  const {children, cluster, endpoint, config = {commitment: 'confirmed'}} = props;

  const rpcUrl = endpoint ?? clusterApiUrl(cluster);

  const connection = useMemo(
    () => new Connection(rpcUrl, config),
    [config, rpcUrl],
  );

  const value = {
    connection,
    cluster,
  };

  return (
    <ConnectionContext.Provider value={value}>
      {children}
    </ConnectionContext.Provider>
  );
};

export const useConnection = (): ConnectionContextState =>
  useContext(ConnectionContext);
```

There is one more app-level provider we are creating: `components/NFTProvider.tsx`. We will fill it out in a couple of steps, but let's create the boilerplate for it:
```tsx
import "react-native-url-polyfill/auto";
import React, { ReactNode, createContext, useContext } from "react";

export interface NFTProviderProps {
  children: ReactNode;
}

export interface NFTContextState {}

const DEFAULT_NFT_CONTEXT_STATE: NFTContextState = {};

const NFTContext = createContext<NFTContextState>(DEFAULT_NFT_CONTEXT_STATE);

export function NFTProvider(props: NFTProviderProps) {
  const { children } = props;
 
  const state = {};

  return <NFTContext.Provider value={state}>{children}</NFTContext.Provider>;
}

export const useNFT = (): NFTContextState => useContext(NFTContext);
```

Notice that we added the `react-native-url-polyfill/auto` polyfill at the top, this will be used for later.

Let's create a boilerplate for our main screen in `screens/MainScreen.tsx`:
```tsx
import {View, Text} from 'react-native';
import React from 'react';

export function MainScreen() {
  return (
    <View>
      <Text>Solana Expo App</Text>
    </View>
  );
}
```

Finally, let's change `App.tsx` to wrap our application our needed providers as well as add some more polyfills.

Change `App.tsx`:
```tsx
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
```

### 6. Metaplex Context

For the NFTProvider we'll be making in the next step, we'll need access to a configured `Metaplex` object. To do this we create a new file `/components/MetaplexProvider.tsx`. Here we plum our mobile wallet adapter into an `IdentitySigner` for the `Metaplex` object to use. This allows it to call several function on our behalf.

Create `/components/MetaplexProvider.tsx`:
```tsx
import {IdentitySigner, Metaplex, MetaplexPlugin} from '@metaplex-foundation/js';

import {
  transact,
  Web3MobileWallet,
} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import {Connection, Transaction} from '@solana/web3.js';
import {useMemo} from 'react';
import { Account } from './AuthProvider';
  
  export const mobileWalletAdapterIdentity = (
    mwaIdentitySigner: IdentitySigner,
  ): MetaplexPlugin => ({
    install(metaplex: Metaplex) {
      metaplex.identity().setDriver(mwaIdentitySigner);
    },
  });

const useMetaplex = (
  connection: Connection,
  selectedAccount: Account | null,
  authorizeSession: (wallet: Web3MobileWallet) => Promise<Account>,
) => {
  return useMemo(() => {
    if (!selectedAccount || !authorizeSession) {
      return {mwaIdentitySigner: null, metaplex: null};
    }

    const mwaIdentitySigner: IdentitySigner = {
      publicKey: selectedAccount.publicKey,
      signMessage: async (message: Uint8Array): Promise<Uint8Array> => {
        return await transact(async (wallet: Web3MobileWallet) => {
          await authorizeSession(wallet);

          const signedMessages = await wallet.signMessages({
            addresses: [selectedAccount.publicKey.toBase58()],
            payloads: [message],
          });

          return signedMessages[0];
        });
      },
      signTransaction: async (
        transaction: Transaction,
      ): Promise<Transaction> => {
        return await transact(async (wallet: Web3MobileWallet) => {
          await authorizeSession(wallet);

          const signedTransactions = await wallet.signTransactions({
            transactions: [transaction],
          });

          return signedTransactions[0];
        });
      },
      signAllTransactions: async (
        transactions: Transaction[],
      ): Promise<Transaction[]> => {
        return transact(async (wallet: Web3MobileWallet) => {
          await authorizeSession(wallet);
          const signedTransactions = await wallet.signTransactions({
            transactions: transactions,
          });
          return signedTransactions;
        });
      },
    };

    const metaplex = Metaplex.make(connection).use(
      mobileWalletAdapterIdentity(mwaIdentitySigner),
    );

    return {metaplex};
  }, [authorizeSession, selectedAccount, connection]);
};

export default useMetaplex;
```

### 6. NFT Context



```tsx
import "react-native-url-polyfill/auto";
import React, { ReactNode, createContext, useContext, useState } from "react";
import {
  Metaplex,
  PublicKey,
  Metadata,
  Nft,
  Sft,
  SftWithToken,
  NftWithToken,
} from "@metaplex-foundation/js";
import { useConnection } from "./ConnectionProvider";
import { Connection, clusterApiUrl } from "@solana/web3.js";
import { transact } from "@solana-mobile/mobile-wallet-adapter-protocol";
import { Account, useAuthorization } from "./AuthProvider";
import RNFetchBlob from "rn-fetch-blob";
import useMetaplex from "./MetaplexProvider";


export interface NFTProviderProps {
  children: ReactNode;
}

export interface NFTContextState {
  metaplex?: Metaplex | null;
  publicKey?: PublicKey | null;
  isLoading: boolean;
  loadedNFTs?: (Nft | Sft | SftWithToken | NftWithToken)[] | null;
  nftOfTheDay: (Nft | Sft | SftWithToken | NftWithToken) | null;
  connect: () => void;
  fetchNFTs: () => void;
  createNFT: (name: string, description: string, fileUri: string) => void;
}

const DEFAULT_NFT_CONTEXT_STATE: NFTContextState = {
  metaplex: new Metaplex(new Connection(clusterApiUrl("devnet"))),
  publicKey: null,
  isLoading: false,
  loadedNFTs: null,
  nftOfTheDay: null,
  connect: () => PublicKey.default,
  fetchNFTs: () => {},
  createNFT: (name: string, description: string, fileUri: string) => {},
};

const NFTContext = createContext<NFTContextState>(DEFAULT_NFT_CONTEXT_STATE);

export function formatDate(date: Date) {
  return `${date.getDate()}.${date.getMonth()}.${date.getFullYear()}`;
}

export function NFTProvider(props: NFTProviderProps) {
  const { children } = props;
  const { connection } = useConnection();
  const { authorizeSession } = useAuthorization();
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [nftOfTheDay, setNftOfTheDay] = useState<
    (Nft | Sft | SftWithToken | NftWithToken) | null
  >(null);
  const [loadedNFTs, setLoadedNFTs] = useState<
    (Nft | Sft | SftWithToken | NftWithToken)[] | null
  >(null);

  const { metaplex } = useMetaplex(connection, account, authorizeSession);

  const connect = () => {
    if (isLoading) return;

    setIsLoading(true);
    transact(async (wallet) => {
      const auth = await authorizeSession(wallet);
      setAccount(auth);
    }).finally(() => {
      setIsLoading(false);
    });
  };

  const fetchNFTs = async () => {
    if (!metaplex || !account || isLoading) return;

    setIsLoading(true);

    try {
      const nfts = await metaplex.nfts().findAllByCreator({
        creator: account.publicKey,
      });

      const loadedNFTs = await Promise.all(
        nfts.map((nft) => {
          return metaplex.nfts().load({ metadata: nft as Metadata });
        })
      );
      setLoadedNFTs(loadedNFTs);

      // Check if we already took a snapshot today
      const nftOfTheDayIndex = loadedNFTs.findIndex((nft)=>{
        return formatDate(new Date(Date.now())) === nft.name;
      })

      if(nftOfTheDayIndex !== -1){
        setNftOfTheDay(loadedNFTs[nftOfTheDayIndex])
      }

    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  // https://nft.storage/api-docs/
  const uploadImage = async (fileUri: string): Promise<string> => {
    const imageBytesInBase64: string = await RNFetchBlob.fs.readFile(
      fileUri,
      "base64"
    );
    const bytes = Buffer.from(imageBytesInBase64, "base64");

    const response = await fetch("https://api.nft.storage/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.EXPO_PUBLIC_NFT_STORAGE_API}`,
        "Content-Type": "image/jpg",
      },
      body: bytes,
    });

    const data = await response.json();
    const cid = data.value.cid;

    return cid as string;
  };

  const uploadMetadata = async (
    name: string,
    description: string,
    imageCID: string
  ): Promise<string> => {
    const response = await fetch("https://api.nft.storage/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.EXPO_PUBLIC_NFT_STORAGE_API}`,
      },
      body: JSON.stringify({
        name,
        description,
        image: `https://ipfs.io/ipfs/${imageCID}`,
      }),
    });

    const data = await response.json();
    const cid = data.value.cid;

    return cid;
  };

  const createNFT = async (
    name: string,
    description: string,
    fileUri: string
  ) => {
    if (!metaplex || !account || isLoading) return;

    setIsLoading(true);
    try {
      const imageCID = await uploadImage(fileUri);
      const metadataCID = await uploadMetadata(name, description, imageCID);

      const nft = await metaplex.nfts().create({
        uri: `https://ipfs.io/ipfs/${metadataCID}`,
        name: name,
        sellerFeeBasisPoints: 0,
      });

      setNftOfTheDay(nft.nft);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const publicKey = account?.publicKey;

  const state = {
    isLoading,
    account,
    publicKey,
    metaplex,
    nftOfTheDay,
    loadedNFTs,
    connect,
    fetchNFTs,
    createNFT,
  };

  return <NFTContext.Provider value={state}>{children}</NFTContext.Provider>;
}

export const useNFT = (): NFTContextState => useContext(NFTContext);
```

### 7. Main Screen
```tsx
import {
  View,
  Button,
  Image,
  StyleSheet,
  ScrollView,
  Text,
} from "react-native";
import React, { useEffect } from "react";
import { formatDate, useNFT } from "../components/NFTProvider";
import * as ImagePicker from 'expo-image-picker';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#292524'
  },
  titleText: {
    color: 'white'
  },
  topSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    paddingTop: 30,
  },
  imageOfDay: {
    width: "80%",
    height: "80%",
    resizeMode: "cover",
    margin: 10,
  },
  bottomSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  carousel: {
    justifyContent: "center",
    alignItems: "center",
  },
  carouselText: {
    textAlign: "center",
    color: 'white'
  },
  carouselImage: {
    width: 100,
    height: 100,
    margin: 5,
    resizeMode: "cover",
  },
});

export interface NFTSnapshot {
  uri: string;
  date: Date;
}

// Placeholder image URL or local source
const PLACEHOLDER: NFTSnapshot = {
  uri: "https://placehold.co/400x400/png",
  date: new Date(Date.now()),
};
const DEFAULT_IMAGES: NFTSnapshot[] = new Array(7).fill(PLACEHOLDER);

export function MainScreen() {
  const { fetchNFTs, connect, publicKey, isLoading, createNFT, loadedNFTs, nftOfTheDay } = useNFT();
  const [currentImage, setCurrentImage] = React.useState<NFTSnapshot>(PLACEHOLDER);
  const [previousImages, setPreviousImages] = React.useState<NFTSnapshot[]>(DEFAULT_IMAGES);
  const todaysDate = new Date(Date.now());

  useEffect(()=>{
    if(!loadedNFTs) return;

    const loadedSnapshots = loadedNFTs.map((loadedNft) => {
      if (!loadedNft.json) return null;
      if (!loadedNft.json.name) return null;
      if (!loadedNft.json.description) return null;
      if (!loadedNft.json.image) return null;

      const uri = loadedNft.json.image;
      const unixTime = Number(loadedNft.json.description);

      if(!uri) return null;
      if(isNaN(unixTime)) return null;

      return {
        uri: loadedNft.json.image,
        date: new Date(unixTime)
      } as NFTSnapshot;
    });
  
    // Filter out null values
    const cleanedSnapshots = loadedSnapshots.filter((loadedSnapshot) => {
      return loadedSnapshot !== null;
    }) as NFTSnapshot[];

    // Sort by date
    cleanedSnapshots.sort((a, b)=>{return b.date.getTime() - a.date.getTime()})
  
    setPreviousImages(cleanedSnapshots as NFTSnapshot[]);
  }, [loadedNFTs])

  useEffect(()=>{
    if(!nftOfTheDay) return;

    setCurrentImage({
      uri: nftOfTheDay.json?.image ?? '',
      date: todaysDate
    })
  }, [nftOfTheDay])

  const mintNFT = async () => {
    
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setCurrentImage({
        uri: result.assets[0].uri,
        date: todaysDate,
      });

      createNFT(
        formatDate(todaysDate),
        `${todaysDate.getTime()}`,
        result.assets[0].uri
      )
    }
  };

  const handleNFTButton = async () => {

    if (!publicKey) {
      connect();
    } else if(loadedNFTs === null){
      fetchNFTs();
    } else if(!nftOfTheDay){
      mintNFT();
    } else {
      alert('All done for the day!')
    }

  };

  const renderNFTButton = () => {
    let buttonText = '';
    if (!publicKey) buttonText = "Connect Wallet";
    else if (loadedNFTs === null) buttonText = "Fetch NFTs";
    else if(!nftOfTheDay) buttonText = "Create Snapshot";
    else buttonText = 'All Done!'
    
    if (isLoading) buttonText = "Loading...";

    return <Button title={buttonText} onPress={handleNFTButton} />;
  };

  const renderPreviousSnapshot = (snapshot: NFTSnapshot, index: number) => {
    const date = snapshot.date;
    const formattedDate = `${date.getDate()}.${date.getMonth()}.${date.getFullYear()}`;

    return (
      <View key={index}>
        <Image source={snapshot} style={styles.carouselImage} />
        <Text style={styles.carouselText}>{formattedDate}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Half */}
      <View style={styles.topSection}>
        <Text style={styles.titleText}>Mint-A-Day</Text>
        <Image source={currentImage} style={styles.imageOfDay} />
        {renderNFTButton()}
      </View>

      {/* Bottom Half */}
      <View style={styles.bottomSection}>
        <ScrollView horizontal contentContainerStyle={styles.carousel}>
          {previousImages.map(renderPreviousSnapshot)}
        </ScrollView>
      </View>
    </View>
  );
}
```

# Challenge

Now it's your turn. How could you put your own spin on the app? Maybe you'd want to add a text field so you can treat NFT like a journal entry. The possibilities are endless!
