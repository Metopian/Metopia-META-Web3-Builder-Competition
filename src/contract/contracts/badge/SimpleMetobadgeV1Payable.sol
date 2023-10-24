// SPDX-License-Identifier: MIT
pragma solidity >=0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "../lib/base64.sol";
import "../lib/utils.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../oracle/IPriceOracle.sol";

error Soulbound();

contract SimpleMetobadgeV1Payable is ERC721, Ownable, ReentrancyGuard {
    string __baseURI = "https://test.metopia.xyz/metadata/";
    string __contractURI = "https://test.metopia.xyz/metadata/";

    using Counters for Counters.Counter;

    mapping(address => uint) _expiries;

    uint year = 365 days;
    uint public _protectionPeriod = 90 days;
    uint public _numFree = 100;

    Counters.Counter private tokenSupplyCounter;
    IPriceOracle priceOracle;

    constructor(address priceOracleAddr) ERC721("Metobadge", "Metobadge") {
        priceOracle = IPriceOracle(priceOracleAddr);
    }

    function getAnnualFee(uint numYears) public view returns (uint) {
        return priceOracle.getAnnualFee(numYears);
    }

    function mint(address to, uint numYears) public payable {
        require(balanceOf(to) == 0, "duplicate");
        require(numYears > 0, "life too short");

        if (_expiries[to] == 0) {
            if (supply() >= _numFree) {
                require(msg.value >= getAnnualFee(numYears));
            } else {
                require(numYears == 1, "greedy");
            }
            _expiries[to] = block.timestamp + numYears * year;
        }
        _safeMint(to, uint256(uint160(to)));
        tokenSupplyCounter.increment();
    }

    function renew(address owner, uint numYears) external payable {
        require(_expiries[owner] > 0, "invalid owner");
        require(
            msg.value >= priceOracle.getAnnualFee(numYears),
            "insufficient funds"
        );
        if (isLocked(owner)) {
            _expiries[owner] += numYears * year;
        } else {
            _expiries[owner] += block.timestamp + numYears * year;
        }
    }

    function burn(address owner) public {
        require(balanceOf(owner) > 0, "invalid id");
        require(isExpired(owner), "not burnable");
        _expiries[owner] = 0;
        _burn(uint256(uint160(owner)));
    }

    function supply() public view returns (uint256) {
        return tokenSupplyCounter.current();
    }

    function expiry(address owner) public view returns (uint256) {
        return _expiries[owner];
    }

    function isLocked(address owner) public view returns (bool) {
        return _expiries[owner] < block.timestamp;
    }

    function isExpired(address owner) public view returns (bool) {
        return _expiries[owner] < block.timestamp + _protectionPeriod;
    }

    function setPriceOracle(address addr) public onlyOwner {
        priceOracle = IPriceOracle(addr);
    }

    function setProtectionPeriod(uint protectionPeriod_) public onlyOwner {
        _protectionPeriod = protectionPeriod_;
    }

    function setNumFree(uint numFree_) public onlyOwner {
        _numFree = numFree_;
    }

    /**
     * @notice SOULBOUND: Block transfers.
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal virtual override {
        require(from == address(0) || to == address(0), "nontransferable");
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    /**
     * @notice SOULBOUND: Block approvals.
     */
    function setApprovalForAll(
        address operator,
        bool _approved
    ) public virtual override {
        revert Soulbound();
    }

    /**
     * @notice SOULBOUND: Block approvals.
     */
    function approve(address to, uint256 tokenId) public virtual override {
        revert Soulbound();
    }

    function withdraw() public nonReentrant onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }

    function withdrawToken(address addr) public nonReentrant onlyOwner {
        IERC20 token = IERC20(addr);
        token.transfer(msg.sender, token.balanceOf(address(this)));
    }

    function _baseURI() internal view override returns (string memory) {
        return __baseURI;
    }

    function setBaseURI(string memory ___baseURI) public onlyOwner {
        __baseURI = ___baseURI;
    }

    function setContractURI(string memory ___contractURI) public onlyOwner {
        __contractURI = ___contractURI;
    }

    function contractURI() public view returns (string memory) {
        return __contractURI;
    }
}
