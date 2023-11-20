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