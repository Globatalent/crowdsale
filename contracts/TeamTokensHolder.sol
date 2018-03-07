pragma solidity ^0.4.18;

/// @title TeamTokensHolder Contract
/// @dev Unlock 40% after 12 months
// Unlock 40% after 12 months
// Unlock 20% after 12 months

import "./MiniMeToken.sol";
import "./TokenContribution.sol";
import "./SafeMath.sol";
import "./ERC20Token.sol";


contract TeamTokensHolder is Owned {
    using SafeMath for uint256;

    uint256 collectedTokens;
    TokenContribution crowdsale;
    MiniMeToken miniMeToken;

    function TeamTokensHolder(address _owner, address _crowdsale, address _token) public{
        owner = _owner;
        crowdsale = TokenContribution(_crowdsale);
        miniMeToken = MiniMeToken(_token);
    }

    /// @notice The owner will call this method to extract the tokens
    function collectTokens() public onlyOwner {
        uint256 balance = miniMeToken.balanceOf(address(this));
        uint256 total = collectedTokens.add(balance);

        uint256 finalizedTime = crowdsale.finalizedTime();

        require(finalizedTime > 0 && getTime() > finalizedTime.add(months(12)));

        uint256 canExtract = 0;
        if (getTime() <= finalizedTime.add(months(24))) {
            canExtract = total.percent(40);
        } else if (getTime() > finalizedTime.add(months(24)) && getTime() <= finalizedTime.add(months(36))) {
            canExtract = total.percent(80);
        } else {
            canExtract = total;
        }

        canExtract = canExtract.sub(collectedTokens);

        if (canExtract > balance) {
            canExtract = balance;
        }

        collectedTokens = collectedTokens.add(canExtract);
        assert(miniMeToken.transfer(owner, canExtract));

        TokensWithdrawn(owner, canExtract);
    }

    function months(uint256 m) internal returns (uint256) {
        return m.mul(30 days);
    }

    function getTime() internal returns (uint256) {
        return now;
    }


    //////////
    // Safety Methods
    //////////

    /// @notice This method can be used by the controller to extract mistakenly
    ///  sent tokens to this contract.
    /// @param _token The address of the token contract that you want to recover
    ///  set to 0 in case you want to extract ether.
    function claimTokens(address _token) public onlyOwner {
        require(_token != address(miniMeToken));
        if (_token == 0x0) {
            owner.transfer(this.balance);
            return;
        }

        ERC20Token token = ERC20Token(_token);
        uint256 balance = token.balanceOf(this);
        token.transfer(owner, balance);
        ClaimedTokens(_token, owner, balance);
    }

    event ClaimedTokens(address indexed _token, address indexed _controller, uint256 _amount);
    event TokensWithdrawn(address indexed _holder, uint256 _amount);
}
