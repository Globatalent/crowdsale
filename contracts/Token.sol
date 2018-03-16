pragma solidity 0.4.19;

import "./MiniMeToken.sol";

contract Token is MiniMeToken {
    // @dev Token constructor just parametrizes the MiniMeIrrevocableVestedToken constructor
    function Token(address _tokenFactory)
    MiniMeToken(
        _tokenFactory,
        0x0,            // no parent token
        0,              // no snapshot block number from parent
        "GBT",          // Token name
        8,             // Decimals
        "GBT",          // Symbol
        true            // Enable transfers
    ) public {}
}
