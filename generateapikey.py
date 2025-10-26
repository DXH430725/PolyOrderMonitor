from py_clob_client.client import ClobClient

host: str = "https://clob.polymarket.com"
key: str = "" #（钱包私钥）This is your Private Key. If using email login export from https://reveal.magic.link/polymarket otherwise export from your Web3 Application
chain_id: int = 137 #No need to adjust this
POLYMARKET_PROXY_ADDRESS: str = '' #This is the address you deposit/send USDC to to FUND your Polymarket account.

### Initialization of a client using a Polymarket Proxy associated with a Browser Wallet(Metamask, Coinbase Wallet, etc)
client = ClobClient(host, key=key, chain_id=chain_id, signature_type=2, funder=POLYMARKET_PROXY_ADDRESS)


print( client.derive_api_key() )
