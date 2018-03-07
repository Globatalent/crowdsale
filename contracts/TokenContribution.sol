pragma solidity ^0.4.18;


import "./Owned.sol";
import "./MiniMeToken.sol";
import "./SafeMath.sol";
import "./ERC20Token.sol";


contract TokenContribution is Owned, TokenController {
    using SafeMath for uint256;

    uint256 constant public maxSupply = 1000000000 ether;

    uint256 constant public percentageToSale = 50;

    // Half of the max supply. 50% for ico
    uint256 constant public saleLimit = (maxSupply * percentageToSale / 100);

    uint256 constant public maxGasPrice = 50000000000;

    uint256 constant public maxCallFrequency = 100;

    MiniMeToken public Token;

    uint256 public startBlock;
    uint256 public endBlock;

    address public destTokensTeam;
    address public destTokensReserve;
    address public destTokensBounties;
    address public destTokensAirdrop;
    address public destTokensAdvisors;
    address public destTokensEarlyInvestors;

    address public tokenController;

    uint256 public totalTokensGenerated;

    uint256 public finalizedBlock;
    uint256 public finalizedTime;

    mapping(address => uint256) public lastCallBlock;

    bool public paused;

    modifier initialized() {
        require(address(Token) != 0x0);
        _;
    }

    modifier contributionOpen() {
        require(getBlockNumber() >= startBlock &&
        getBlockNumber() <= endBlock &&
        finalizedBlock == 0 &&
        address(Token) != 0x0);
        _;
    }

    modifier notPaused() {
        require(!paused);
        _;
    }

    function TokenContribution() {
        paused = false;
    }


    /// @notice This method should be called by the owner before the contribution
    ///  period starts This initializes most of the parameters
    function initialize(
        address _token,
        address _tokenController,
        uint256 _startBlock,
        uint256 _endBlock,
        address _destTokensReserve,
        address _destTokensTeam,
        address _destTokensBounties,
        address _destTokensAirdrop,
        address _destTokensAdvisors,
        address _destTokensEarlyInvestors
    ) public onlyOwner {
        // Initialize only once
        require(address(Token) == 0x0);

        Token = MiniMeToken(_token);
        require(Token.totalSupply() == 0);
        require(Token.controller() == address(this));
        require(Token.decimals() == 18); // Same amount of decimals as ETH

        require(_tokenController != 0x0);
        tokenController = _tokenController;

        require(_startBlock >= getBlockNumber());
        require(_startBlock < _endBlock);
        startBlock = _startBlock;
        endBlock = _endBlock;

        require(_destTokensReserve != 0x0);
        destTokensReserve = _destTokensReserve;

        require(_destTokensTeam != 0x0);
        destTokensTeam = _destTokensTeam;

        require(_destTokensBounties != 0x0);
        destTokensBounties = _destTokensBounties;

        require(_destTokensAirdrop != 0x0);
        destTokensAirdrop = _destTokensAirdrop;

        require(_destTokensAdvisors != 0x0);
        destTokensAdvisors = _destTokensAdvisors;

        require(_destTokensEarlyInvestors != 0x0);
        destTokensEarlyInvestors= _destTokensEarlyInvestors;
    }

    /// @notice If anybody sends Ether directly to this contract, consider he is
    ///  getting tokens.
    function() public payable notPaused {
        proxyPayment(msg.sender);
    }


    //////////
    // MiniMe Controller functions
    //////////

    /// @notice This method will generally be called by the Token contract to
    ///  acquire tokens. Or directly from third parties that want to acquire tokens in
    ///  behalf of a token holder.
    /// @param _th Token holder where the tokens will be minted.
    function proxyPayment(address _th) public payable returns (bool) {
        return false;
    }

    function onTransfer(address, address, uint256) public returns (bool) {
        return false;
    }

    function onApprove(address, address, uint256) public returns (bool) {
        return false;
    }

    function generate(address _th, uint256 _amount) public onlyOwner {
        assert(tokensIssued() <= saleLimit);
        assert(_amount > 0);

        assert(Token.generateTokens(_th, _amount));
        NewSale(_th, _amount);
    }

    // NOTE on Percentage format
    // Right now, Solidity does not support decimal numbers. (This will change very soon)
    //  So in this contract we use a representation of a percentage that consist in
    //  expressing the percentage in "x per 10**18"
    // This format has a precision of 16 digits for a percent.
    // Examples:
    //  3%   =   3*(10**16)
    //  100% = 100*(10**16) = 10**18
    //
    // To get a percentage of a value we do it by first multiplying it by the percentage in  (x per 10^18)
    //  and then divide it by 10**18
    //
    //              Y * X(in x per 10**18)
    //  X% of Y = -------------------------
    //               100(in x per 10**18)
    //


    /// @notice This method will can be called by the owner before the contribution period
    ///  end or by anybody after the `endBlock`. This method finalizes the contribution period
    ///  by creating the remaining tokens and transferring the controller to the configured
    ///  controller.
    function finalize() public initialized {
        require(getBlockNumber() >= startBlock);
        require(msg.sender == owner || getBlockNumber() > endBlock);
        require(finalizedBlock == 0);

        finalizedBlock = getBlockNumber();
        finalizedTime = now;

        uint256 percentageToTeam = percent(18);

        uint256 percentageToCommunity = percent(50);

        uint256 percentageToReserve = percent(8);

        uint256 percentageToBounties = percent(13);

        uint256 percentageToAirdrop = percent(2);

        uint256 percentageToAdvisors = percent(7);

        uint256 percentageToEarlyInvestors = percent(2);

        //
        //                    percentageToBounties
        //  bountiesTokens = ----------------------- * maxSupply
        //                      percentage(100)
        //
        assert(Token.generateTokens(
                destTokensBounties,
                maxSupply.mul(percentageToBounties).div(percent(100))));

        //
        //                    percentageToReserve
        //  reserveTokens = ----------------------- * maxSupply
        //                      percentage(100)
        //
        assert(Token.generateTokens(
                destTokensReserve,
                maxSupply.mul(percentageToReserve).div(percent(100))));

        //
        //                   percentageToTeam
        //  teamTokens = ----------------------- * maxSupply
        //                   percentage(100)
        //
        assert(Token.generateTokens(
                destTokensTeam,
                maxSupply.mul(percentageToTeam).div(percent(100))));

        //
        //                   percentageToAirdrop
        //  airdropTokens = ----------------------- * maxSupply
        //                   percentage(100)
        //
        assert(Token.generateTokens(
                destTokensAirdrop,
                maxSupply.mul(percentageToAirdrop).div(percent(100))));

        //
        //                      percentageToAdvisors
        //  advisorsTokens = ----------------------- * maxSupply
        //                      percentage(100)
        //
        assert(Token.generateTokens(
                destTokensAdvisors,
                maxSupply.mul(percentageToAdvisors).div(percent(100))));

        //
        //                      percentageToEarlyInvestors
        //  advisorsTokens = ------------------------------ * maxSupply
        //                          percentage(100)
        //
        assert(Token.generateTokens(
                destTokensEarlyInvestors,
                maxSupply.mul(percentageToEarlyInvestors).div(percent(100))));

        Token.changeController(tokenController);

        Finalized();
    }

    function percent(uint256 p) internal returns (uint256) {
        return p.mul(10 ** 16);
    }

    /// @dev Internal function to determine if an address is a contract
    /// @param _addr The address being queried
    /// @return True if `_addr` is a contract
    function isContract(address _addr) constant internal returns (bool) {
        if (_addr == 0) return false;
        uint256 size;
        assembly {
            size := extcodesize(_addr)
        }
        return (size > 0);
    }


    //////////
    // Constant functions
    //////////

    /// @return Total tokens issued in weis.
    function tokensIssued() public constant returns (uint256) {
        return Token.totalSupply();
    }


    //////////
    // Testing specific methods
    //////////

    /// @notice This function is overridden by the test Mocks.
    function getBlockNumber() internal constant returns (uint256) {
        return block.number;
    }


    //////////
    // Safety Methods
    //////////

    /// @notice This method can be used by the controller to extract mistakenly
    ///  sent tokens to this contract.
    /// @param _token The address of the token contract that you want to recover
    ///  set to 0 in case you want to extract ether.
    function claimTokens(address _token) public onlyOwner {
        if (Token.controller() == address(this)) {
            Token.claimTokens(_token);
        }
        if (_token == 0x0) {
            owner.transfer(this.balance);
            return;
        }

        ERC20Token token = ERC20Token(_token);
        uint256 balance = token.balanceOf(this);
        token.transfer(owner, balance);
        ClaimedTokens(_token, owner, balance);
    }


    /// @notice Pauses the contribution if there is any issue
    function pauseContribution() onlyOwner {
        paused = true;
    }

    /// @notice Resumes the contribution
    function resumeContribution() onlyOwner {
        paused = false;
    }

    event ClaimedTokens(address indexed _token, address indexed _controller, uint256 _amount);

    event NewSale(address indexed _th, uint256 _amount);

    event GuaranteedAddress(address indexed _th, uint256 _limit);

    event Finalized();

}
