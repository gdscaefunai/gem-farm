import { initGemFarm } from "./gemfarm";
import { BN } from '@project-serum/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import env from "react-dotenv";
import { stringifyPKsAndBNs } from '@gemworks/gem-farm-ts';
import { useWallet } from '@solana/wallet-adapter-react';
// const network = "https://api.devnet.solana.com";
// const connection = new Connection(network, "confirmed");
// async function getProvider() {
//     /* create the provider and return it to the caller */
//     /* network set to local network for now */
//     const network = "https://api.devnet.solana.com";
//     const connection = new Connection(network, opts.preflightCommitment);

//     const provider = new Provider(
//         connection, wallet, opts.preflightCommitment,
//     );
//     return provider;
// }
// const provider = await getProvider()
// let gb = await initGemBank(connection, provider)
// const bank = ref < PublicKey > ();
// const vault = ref < PublicKey > ();
// const vaultAcc = ref < any > ();
// const gdrs = ref < PublicKey[] > ([]);
// const vaultLocked = ref < boolean > (false);



export async function fetchFarn(connection, wallet) {
    console.log("constructing farm")
    console.log("received wallet ", wallet.publicKey.toBase58())
    let gf = await initGemFarm(connection, wallet)
    console.log("gf is: ", gf)
    const farmAcc = await gf.fetchFarmAcc(new PublicKey(env.farm_id));
    console.log(
        `farm found at ${env.farm_id}:`,
        stringifyPKsAndBNs(farmAcc)
    );
    return farmAcc
};
export async function fetchFarmer(connection, wallet) {
    let gf = await initGemFarm(connection, wallet)
    const [farmerPDA] = await gf.findFarmerPDA(
        new PublicKey(env.farm_id),
        wallet.publicKey
    );
    const farmer = {}
    farmer.farmerIdentity = wallet.publicKey?.toBase58();
    farmer.farmerAcc = await gf.fetchFarmerAcc(farmerPDA);
    farmer.farmerState = gf.parseFarmerState(farmer.farmerAcc);
    //await updateAvailableRewards();
    console.log(
        `farmer found at ${farmer.farmerIdentity}:`,
        stringifyPKsAndBNs(farmer.farmerAcc)
    );
    return farmer
};

export async function getFarmerDeets(connection, wallet) {
    let payload = []
    const farmDeets = await fetchFarn(connection, wallet)
    payload.push(farmDeets)
    const farmerDeets = await fetchFarmer(connection, wallet)
    payload.push(farmerDeets)
    console.log("payload: ", payload)
    return payload
}

export async function stakerMover(nft, connection, wallet) {
    let nftArray = []
    nftArray.push(nft)
    console.log("selectedNfts: ", nft.mint)
    let gf = await initGemFarm(connection, wallet)
    const gemsResult = await addGems(nftArray, gf)
    const stakeResult = await beginStaking(gf)
    return stakeResult
}

const addSingleGem = async (
    gemMint,
    gemSource,
    creator, gf
) => {
    console.log("flash depost: ", gemMint.toBase58())
    await gf.flashDepositWallet(
        new PublicKey(env.farm_id),
        '1',
        gemMint,
        gemSource,
        creator
    );

    await fetchFarmer();
};
const addGems = async (selectedNFTs, gf) => {
    console.log("selected NFTs: ", selectedNFTs[0].mint.toBase58())
    await Promise.all(
        selectedNFTs.map((nft) => {
            const creator = new PublicKey(
                //todo currently simply taking the 1st creator
                nft.onchainMetadata.data.creators[0].address
            );
            console.log('creator is', creator.toBase58());
            addSingleGem(nft.mint, nft.pubkey, creator, gf);
        })
    );
    console.log(
        `added another ${selectedNFTs.length} gems into staking vault`
    );
};
const beginStaking = async (gf) => {
    const stakeResult = await gf.stakeWallet(new PublicKey(env.farm_id));
    return stakeResult
    // const farmerResult = await fetchFarmer();
    // return farmerResult

};

export async function endStaking(connection, wallet) {
    let gf = await initGemFarm(connection, wallet)
    const endStakeResults = await gf.unstakeWallet(new PublicKey(env.farm_id));
    // await fetchFarmer();
    // selectedNFTs.value = [];
};


// export async function depositNftsOnChain(nft) {

//     console.log(nft);
//     const creator = new PublicKey(
//         //todo currently simply taking the 1st creator
//         nft.onchainMetadata.data.creators[0].address
//     );
//     console.log('creator is', creator.toBase58());
//     await depositGem(nft.mint, creator, nft.pubkey);


// };
// export async function freshStart(wallet, connection) {
//     if (wallet && connection) {
//         const gf = await initGemFarm(connection, wallet);
//         farmerIdentity.value = wallet.publicKey?.toBase58();
//         //reset stuff
//         farmAcc.value = undefined;
//         farmerAcc.value = undefined;
//         farmerState.value = undefined;
//         availableA.value = undefined;
//         availableB.value = undefined;
//         try {
//             await fetchFarn();
//             await fetchFarmer(wallet);
//         } catch (e) {
//             console.log(`farm with PK ${env.farm_id} not found :(`);
//         }
//     }
// };


// const depositGem = async (mint, creator, source) => {
//     const { txSig } = await gb.depositGemWallet(
//         bank.value,
//         vault.value,
//         new BN(1),
//         mint,
//         source,
//         creator
//     );
//     console.log('deposit done', txSig);
// };

// const addSingleGem = async (
//     gemMint,
//     gemSource,
//     creator
// ) => {
//     await gf.flashDepositWallet(
//         new PublicKey(env.farm_id),
//         '1',
//         gemMint,
//         gemSource,
//         creator
//     );
//     await fetchFarmer();
// };