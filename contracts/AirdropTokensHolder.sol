pragma solidity ^0.4.18;


import "./MiniMeToken.sol";
import "./TokenContribution.sol";
import "./SafeMath.sol";
import "./ERC20Token.sol";


contract AirdropTokensHolder is Owned {
    using SafeMath for uint256;

    uint256 collectedTokens;
    TokenContribution crowdsale;
    MiniMeToken miniMeToken;

    function AirdropTokensHolder(address _owner, address _crowdsale, address _miniMeToken) public {
        owner = _owner;
        crowdsale = TokenContribution(_crowdsale);
        miniMeToken = MiniMeToken(_miniMeToken);
    }

    /// @notice The owner will call this method to extract the tokens
    function collectTokens() public onlyOwner {
        uint256 balance = miniMeToken.balanceOf(address(this));
        uint256 total = collectedTokens.add(balance);

        uint256 finalizedTime = crowdsale.finalizedTime();

        require(finalizedTime > 0 && getTime() > finalizedTime.add(months(18)));

        uint256 canExtract = 0;
        if (getTime() <= finalizedTime.add(months(36))) {
            require(collectedTokens < total.percent(50));
            canExtract = total.percent(50);
        } else {
            require(collectedTokens < total);
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
