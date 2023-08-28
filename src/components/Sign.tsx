import React, { useState } from "react";
import { BrowserProvider } from "ethers";
import { getW3Provider } from "w3-evm-react";

const Sign = () => {
  const walletProvider = getW3Provider();
  const [signature, setSignature] = useState<string>();

  async function signMessage() {
    if (!walletProvider) throw new Error("User is not connected");

    const provider = new BrowserProvider(walletProvider);
    const signer = await provider.getSigner();
    const sn = await signer.signMessage(
      "Hello From Ethers and Web3Modal v3 :D"
    );
    setSignature(sn);
  }

  return (
    <div>
      Sign with Ethers
      <br />
      <button onClick={signMessage}>Sign</button>
      <br />
      <span>{signature}</span>
    </div>
  );
};

export default Sign;
