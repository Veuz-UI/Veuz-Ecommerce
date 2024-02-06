<!DOCTYPE html>
<html class="no-js" lang="en">

<head>
    <meta charset="utf-8" />
    <title>Veuz</title>
    <meta http-equiv="x-ua-compatible" content="ie=edge" />
    <meta name="description" content="" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta property="og:title" content="" />
    <meta property="og:type" content="" />
    <meta property="og:url" content="" />
    <meta property="og:image" content="" />
    <!-- Favicon -->
    <link rel="shortcut icon" type="image/x-icon" href="assets/imgs/favicon.ico" />
    <!-- Template CSS -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@200;300;400;500;600;700;800;900&display=swap"
        rel="stylesheet">
    <link rel="stylesheet" href="assets/css/vendors/bootstrap.min.css">
    <link rel="stylesheet" href="assets/css/plugins/animate.min.css" />
    <link rel="stylesheet" href="assets/css/style.css" />

</head>

<body>
    <?php include 'header.php';?>
    <main class="main">
   
            <!-- brudcrumbs -->
            <section class="breadcrumb-div">
                <div class="container">
                    <ul class="breadcrumb-list">
                        <li> <a href="index.php">Home</a>
                            <span class="separator" aria-hidden="true">&rsaquo;</span></li>
                        <li class="active-brudcrumb">
                            <a href="#">Checkout</a>
                           
                        </li>

                    </ul>
                </div>
            </section>
            <section class="common-v-padding pt-0">
                <div class="container">   
                    <!-- product slider section -->
                    <div class="row">
                        <div class="col-md-12">
                            <div class="section-title1 wow animate__animated animate__fadeIn" data-wow-delay="0">
                                <h3>Shipping & Payment</h3>
                                <hr>
                            </div>
                        </div>
                        <div class="col-md-7">
                         <div class="shipping-addrss">
                            <h4>Shipping Address</h4>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label>Full Name</label>
                                        <input type="text" class="form-control" placeholder="Enter Your Name">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label>Mobile Number</label>
                                        <input type="text" class="form-control" placeholder="Enter Mobile Number">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label>Pincode</label>
                                        <input type="text" class="form-control" placeholder="Enter Your Pincode">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label>City</label>
                                        <input type="text" class="form-control" placeholder="Enter Your City">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label>State</label>
                                        <input type="text" class="form-control" placeholder="Enter Your State">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label>Building name or number</label>
                                        <input type="text" class="form-control" placeholder="Enter Building Details">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label>Street name or number</label>
                                        <input type="text" class="form-control" placeholder="Enter your street details">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label>Landmark <span>(Optional)</span></label>
                                        <input type="text" class="form-control" placeholder="Enter landmark details">
                                    </div>
                                </div>
                                <div class="col-md-12">
                                    <div class="form-group">
                                        <label>Address Type <span>(Optional)</span></label>
                                        <div class="address-type">
                                            <div class="custome-radio">
                                                <input class="form-check-input" required="" type="radio" name="address-type" id="exampleRadios3" checked>
                                                <label class="form-check-label" for="exampleRadios3">Home</label>
                                            </div>
                                            <div class="custome-radio">
                                                <input class="form-check-input" required="" type="radio" name="address-type" id="exampleRadios4">
                                                <label class="form-check-label" for="exampleRadios4">Office</label>
                                            </div>
                                          
                                        </div>
                                        <div class="default-shipping">
                                            <div class="custome-checkbox">
                                                <input class="form-check-input" type="checkbox" name="checkbox" id="exampleCheckbox11" value="">
                                                <label class="form-check-label" for="exampleCheckbox11"><span>Use this as my default shipping address.</span></label>
                                            </div>
                                          
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-12 mt-2">
                                    <button class="submit-btn">Add Address</button>
                                </div>
                            </div>
                            
                         </div>
                         <div class="shipping-addrss">
                            <h4>Payment Method</h4>
                            <div class="row">
                                <div class="col-md-5">
                                    <div class="dashboard-menu">
                                        <ul class="nav flex-column" role="tablist">
                                            <li class="nav-item">
                                                <a class="nav-link active" id="upi-tab" data-bs-toggle="tab" href="#upi" role="tab" aria-controls="dashboard" aria-selected="true"><div><svg width="19" height="24" viewBox="0 0 19 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M8.79969 24C8.73969 24 8.67889 23.9856 8.62129 23.9576C8.42369 23.8584 8.34289 23.6184 8.44209 23.4208L9.24209 21.8208C9.31089 21.6848 9.44849 21.6 9.60049 21.6C11.4285 21.6 11.9389 21.0144 12.4621 20.1856C12.5805 19.9992 12.8285 19.9448 13.0141 20.0608C13.2005 20.1784 13.2565 20.4264 13.1389 20.6128C12.4549 21.696 11.6845 22.3432 9.84929 22.396L9.15889 23.7784C9.08769 23.9184 8.94689 24 8.79969 24Z" fill="black"/>
                                                    <path d="M17.4669 1.99922C17.1421 1.72082 16.7293 1.58482 16.3021 1.61922C15.8749 1.65282 15.4877 1.85042 15.2109 2.17522L14.8005 2.65522V3.88642L15.8189 2.69442C15.9581 2.53202 16.1517 2.43362 16.3653 2.41682C16.5741 2.40002 16.7845 2.46722 16.9469 2.60722C17.1093 2.74562 17.2085 2.93922 17.2253 3.15202C17.2421 3.36482 17.1749 3.57122 17.0349 3.73522L15.9861 4.96162C15.8429 5.12882 15.8629 5.38162 16.0309 5.52562C16.1981 5.66882 16.4509 5.64882 16.5949 5.48162L17.6421 4.25522C17.9205 3.92962 18.0549 3.51602 18.0221 3.09042C17.9885 2.66402 17.7917 2.27602 17.4669 1.99922Z" fill="black"/>
                                                    <path d="M7.59922 2.40013H11.5992C11.82 2.40013 11.9992 2.22093 11.9992 2.00013C11.9992 1.77853 11.82 1.60013 11.5992 1.60013H7.59922C7.37762 1.60013 7.19922 1.77853 7.19922 2.00013C7.19922 2.22093 7.37762 2.40013 7.59922 2.40013Z" fill="black"/>
                                                    <path d="M9.20054 17.6H10.0005C10.2213 17.6 10.4005 17.4208 10.4005 17.2C10.4005 16.9784 10.2213 16.8 10.0005 16.8H9.20054C8.97894 16.8 8.80054 16.9784 8.80054 17.2C8.80054 17.4208 8.97894 17.6 9.20054 17.6Z" fill="black"/>
                                                    <path d="M9.60222 14.4008C10.7238 14.4008 11.6022 13.5224 11.6022 12.4008C11.6022 11.4928 10.9846 10.8312 9.76942 10.4344L9.67822 10.4048C9.22302 10.256 8.80222 10.056 8.80222 9.60083C8.80222 9.12963 9.13102 8.80083 9.60222 8.80083C10.1654 8.80083 10.5406 9.10243 10.5438 9.10563C10.7142 9.24803 10.9662 9.22643 11.1078 9.05763C11.2502 8.88803 11.2278 8.63683 11.0598 8.49443C11.0358 8.47443 10.463 8.00003 9.60222 8.00003C8.68942 8.00003 8.00222 8.68803 8.00222 9.60003C8.00222 10.6992 9.07742 11.0504 9.43022 11.164L9.52062 11.1936C10.3838 11.4744 10.8022 11.8704 10.8022 12.4C10.8022 13.084 10.2862 13.6 9.60222 13.6C8.85982 13.6 8.43502 13.1104 8.32222 12.96C8.18942 12.7824 7.93742 12.748 7.76222 12.8792C7.58462 13.012 7.54862 13.2624 7.68142 13.4392C7.85022 13.6664 8.48862 14.4008 9.60222 14.4008Z" fill="black"/>
                                                    <path d="M9.59946 15.2009C9.82026 15.2009 9.99946 15.0217 9.99946 14.8009V14.4009C9.99946 14.1793 9.82026 14.0009 9.59946 14.0009C9.37786 14.0009 9.19946 14.1793 9.19946 14.4009V14.8009C9.19946 15.0217 9.37786 15.2009 9.59946 15.2009Z" fill="black"/>
                                                    <path d="M9.59946 8.40081C9.82026 8.40081 9.99946 8.22161 9.99946 8.00081V7.60081C9.99946 7.37921 9.82026 7.20081 9.59946 7.20081C9.37786 7.20081 9.19946 7.37921 9.19946 7.60081V8.00081C9.19946 8.22161 9.37786 8.40081 9.59946 8.40081Z" fill="black"/>
                                                    <path d="M15.0501 10.096C14.6685 10.096 14.2997 9.95921 14.0109 9.71201C13.6861 9.43521 13.4893 9.04721 13.4557 8.62161C13.4221 8.19601 13.5573 7.78241 13.8357 7.45681L13.9629 7.29521C14.5325 6.62721 15.5845 6.55361 16.2293 7.10641C16.5533 7.38321 16.7509 7.77121 16.7845 8.19681C16.8181 8.62241 16.6829 9.03601 16.4045 9.36161L16.2773 9.52321C15.9629 9.89121 15.5189 10.096 15.0501 10.096ZM15.1893 7.52081C14.9549 7.52081 14.7333 7.62241 14.5813 7.80081L14.4541 7.96401C14.3045 8.13921 14.2373 8.34561 14.2533 8.55841C14.2701 8.77121 14.3685 8.96481 14.5317 9.10401C14.8557 9.38241 15.3845 9.33841 15.6589 9.01601L15.7861 8.85361C15.9357 8.67841 16.0029 8.47121 15.9861 8.25841C15.9693 8.04561 15.8709 7.85201 15.7085 7.71361C15.5637 7.58881 15.3797 7.52081 15.1893 7.52081Z" fill="black"/>
                                                    <path d="M14.8557 13.312C14.4749 13.312 14.1053 13.1752 13.8165 12.928C13.4925 12.6512 13.2957 12.2632 13.2621 11.8376C13.2285 11.412 13.3629 10.9984 13.6421 10.6728L14.2493 9.97199C14.7973 9.33039 15.8597 9.24479 16.5037 9.79839C16.8285 10.0752 17.0253 10.4624 17.0589 10.8888C17.0925 11.3144 16.9573 11.728 16.6789 12.0528L16.0709 12.7544C15.7685 13.108 15.3253 13.312 14.8557 13.312ZM15.4637 10.212C15.2293 10.212 15.0077 10.3144 14.8557 10.492L14.2477 11.1944C14.1101 11.3552 14.0429 11.5616 14.0589 11.7752C14.0757 11.988 14.1749 12.1816 14.3365 12.32C14.6613 12.5984 15.1885 12.5544 15.4645 12.232L16.0725 11.5304C16.2101 11.3688 16.2773 11.1624 16.2613 10.9496C16.2445 10.7368 16.1461 10.5432 15.9829 10.404C15.8381 10.2808 15.6541 10.212 15.4637 10.212Z" fill="black"/>
                                                    <path d="M15.2007 7.1264V2C15.2007 0.8976 14.3031 0 13.2007 0H6.00073C4.89833 0 4.00073 0.8976 4.00073 2V9.2C4.00073 9.4208 4.17913 9.6 4.40073 9.6C4.62153 9.6 4.80073 9.4208 4.80073 9.2V2C4.80073 1.3384 5.33913 0.8 6.00073 0.8H13.2007C13.8623 0.8 14.4007 1.3384 14.4007 2V7.4224C14.6271 7.224 14.9119 7.124 15.2007 7.1264Z" fill="black"/>
                                                    <path d="M14.4006 16.128V17.2C14.4006 17.8616 13.8622 18.4 13.2006 18.4H9.1998C8.979 18.4 8.7998 18.5784 8.7998 18.8C8.7998 19.0208 8.979 19.2 9.1998 19.2H13.2006C14.303 19.2 15.2006 18.3024 15.2006 17.2V16.136C15.0766 16.1784 14.9486 16.2048 14.8182 16.2048C14.6766 16.2048 14.535 16.1784 14.4006 16.128Z" fill="black"/>
                                                    <path d="M14.8182 16.6048C14.4366 16.6048 14.0678 16.468 13.7782 16.2208C13.4542 15.944 13.2574 15.556 13.2238 15.1304C13.1902 14.7048 13.3254 14.2912 13.603 13.9656L14.211 13.2648C14.7582 12.6224 15.8206 12.5384 16.4646 13.0912C16.7886 13.368 16.9862 13.756 17.0198 14.1816C17.0534 14.6072 16.9182 15.0208 16.6398 15.3456L16.0318 16.0472C15.731 16.4008 15.2878 16.6048 14.8182 16.6048ZM15.4262 13.5048C15.1918 13.5048 14.9702 13.6072 14.8182 13.7848L14.2094 14.4872C14.0718 14.648 14.0054 14.8544 14.0214 15.068C14.0382 15.2808 14.1366 15.4744 14.299 15.6128C14.6238 15.892 15.1518 15.848 15.4262 15.5256L16.035 14.824C16.1718 14.6624 16.239 14.456 16.223 14.2432C16.2062 14.0312 16.1078 13.8376 15.9454 13.6984C15.8006 13.5736 15.6166 13.5048 15.4262 13.5048Z" fill="black"/>
                                                    <path d="M0.400031 24C0.340031 24 0.279231 23.9856 0.221631 23.9576C0.0240314 23.8584 -0.0567685 23.6184 0.0424314 23.4208L1.97043 19.5648L1.01923 16.5408C0.800031 15.8416 0.748831 14.7344 0.902431 14.0184L1.60003 10.7648L1.60083 6.8288C1.60083 6.608 1.78003 6.4288 2.00083 6.4288L2.11443 6.4232C2.48963 6.3984 3.36803 6.3416 4.02963 6.9616C4.54163 7.4416 4.80083 8.2128 4.80083 9.2544V12.8328C5.46643 13.3272 7.68163 15.224 7.96163 18.7696C7.97843 18.9896 7.81363 19.1824 7.59363 19.2C7.37923 19.2176 7.18083 19.0528 7.16323 18.8328C6.87203 15.1344 4.21203 13.396 4.18563 13.3792C4.06963 13.304 4.00083 13.1776 4.00083 13.0408V9.2544C4.00083 8.4424 3.82643 7.868 3.48243 7.5456C3.16163 7.244 2.71603 7.2048 2.40083 7.2104L2.40003 10.808C2.40003 10.836 2.39683 10.864 2.39123 10.8912L1.68403 14.1864C1.55923 14.7664 1.60483 15.7344 1.78243 16.3008L2.78243 19.4792C2.81283 19.5776 2.80483 19.6848 2.75843 19.7776L0.758431 23.7776C0.688031 23.9184 0.547231 24 0.400031 24Z" fill="black"/>
                                                    <path d="M12.1457 5.8544C12.0433 5.8544 11.9417 5.8152 11.8625 5.7376C10.6545 4.528 8.5457 4.528 7.3377 5.7376C7.1817 5.8936 6.9281 5.8936 6.7713 5.7376C6.6153 5.5816 6.6153 5.328 6.7713 5.1712C7.5281 4.416 8.5329 4 9.6009 4C10.6689 4 11.6729 4.416 12.4289 5.1712C12.5849 5.328 12.5849 5.5808 12.4289 5.7376C12.3505 5.8152 12.2489 5.8544 12.1457 5.8544Z" fill="black"/>
                                                    <path d="M11.0151 6.9856C10.9127 6.9856 10.8103 6.9472 10.7319 6.8688C10.1271 6.2648 9.07433 6.2648 8.46873 6.8688C8.31273 7.0256 8.05913 7.0256 7.90313 6.8688C7.74713 6.7128 7.74713 6.4592 7.90313 6.3032C8.80953 5.396 10.3911 5.396 11.2975 6.3032C11.4535 6.4592 11.4535 6.7128 11.2975 6.8688C11.2191 6.9472 11.1167 6.9856 11.0151 6.9856Z" fill="black"/>
                                                    </svg>
                                                    UPI</div> <h6>Pay with UPI  App or ID</h6></a>
                                            </li>
                                            <li class="nav-item">
                                                <a class="nav-link" id="credit-tab" data-bs-toggle="tab" href="#credit" role="tab" aria-controls="orders" aria-selected="false"><div><svg width="21" height="17" viewBox="0 0 21 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M20.6268 1.79358C20.3547 1.47194 19.9737 1.27548 19.5538 1.24041L4.76538 0.00559792C4.34546 -0.0294703 3.9372 0.101082 3.61551 0.373137C3.29514 0.644126 3.09896 1.02323 3.06279 1.44106L2.76526 4.2324H1.57725C0.707558 4.2324 0 4.93996 0 5.80965V15.0669C0 15.9366 0.707558 16.6442 1.57725 16.6442H16.4172C17.2869 16.6442 17.9945 15.9366 17.9945 15.0669V13.5652L18.5211 13.6092C18.5655 13.6129 18.6097 13.6147 18.6535 13.6147C19.4643 13.6147 20.1554 12.9909 20.2241 12.1686L20.9944 2.94349C21.0294 2.52362 20.8989 2.11527 20.6268 1.79358ZM1.57725 5.05271H16.4172C16.8345 5.05271 17.1742 5.39228 17.1742 5.80965V6.65318H0.820309V5.80965C0.820309 5.39228 1.15988 5.05271 1.57725 5.05271ZM0.820309 7.47349H17.1742V9.17517H0.820309V7.47349ZM16.4172 15.8239H1.57725C1.15988 15.8239 0.820309 15.4843 0.820309 15.0669V9.99548H17.1742V15.0669C17.1742 15.4843 16.8345 15.8239 16.4172 15.8239ZM20.1769 2.8752L19.4066 12.1004C19.3719 12.5163 19.0052 12.8266 18.5893 12.7917L17.9945 12.742V5.80965C17.9945 4.93996 17.2869 4.2324 16.4172 4.2324H3.59025L3.87895 1.52374C3.87928 1.52063 3.87957 1.51755 3.87982 1.51439C3.91456 1.09845 4.28107 0.788214 4.69713 0.823077L19.4856 2.05789C19.6871 2.0747 19.87 2.169 20.0005 2.32338C20.1311 2.47776 20.1938 2.67369 20.1769 2.8752Z" fill="black"/>
                                                    <path d="M15.4572 11.2149H11.5098C11.2832 11.2149 11.0996 11.3986 11.0996 11.6251V14.2004C11.0996 14.4269 11.2832 14.6106 11.5098 14.6106H15.4572C15.6837 14.6106 15.8673 14.4269 15.8673 14.2004V11.6251C15.8673 11.3986 15.6837 11.2149 15.4572 11.2149ZM15.047 13.7903H11.9199V12.0352H15.047V13.7903Z" fill="black"/>
                                                    </svg>
                                                    Credit Card / Debit Card</div><h6>Pay with UPI  App or ID</h6></a>
                                            </li>

                                            <li class="nav-item">
                                                <a class="nav-link" href="#"><div><svg width="21" height="18" viewBox="0 0 21 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M19.7806 3.752H5.79776C5.6094 3.752 5.45671 3.90469 5.45671 4.09304C5.45671 4.2814 5.6094 4.43409 5.79776 4.43409H7.85937C6.34584 5.39718 5.43724 7.07381 5.45671 8.86767C5.43724 10.6615 6.34584 12.3382 7.85937 13.3012H0.682089V4.43409H4.09253C4.28089 4.43409 4.43358 4.2814 4.43358 4.09304C4.43358 3.90469 4.28089 3.752 4.09253 3.752H0.682089C0.305382 3.752 0 4.05738 0 4.43409V13.3012C0 13.678 0.305382 13.9833 0.682089 13.9833H19.7806C20.1573 13.9833 20.4627 13.678 20.4627 13.3012V4.43409C20.4627 4.05738 20.1573 3.752 19.7806 3.752ZM6.1388 8.86767C6.1388 6.42306 7.97464 4.43409 10.2313 4.43409C12.488 4.43409 14.3239 6.42306 14.3239 8.86767C14.3239 11.3123 12.488 13.3012 10.2313 13.3012C7.97464 13.3012 6.1388 11.3123 6.1388 8.86767ZM19.7806 13.3012H12.6033C14.1168 12.3382 15.0254 10.6615 15.006 8.86767C15.0254 7.07381 14.1168 5.39718 12.6033 4.43409H19.7806V13.3012Z" fill="black"/>
                                                    <path d="M17.9859 0.0721192C17.8244 -0.00868133 17.6375 -0.022172 17.4661 0.0346043L10.12 2.4966C9.94109 2.5565 9.84458 2.75011 9.90448 2.92905C9.96438 3.10798 10.158 3.20448 10.3369 3.14459L17.681 0.682589L18.4347 2.92973C18.4734 3.04548 18.5709 3.1318 18.6905 3.15618C18.81 3.18055 18.9335 3.13927 19.0144 3.04789C19.0953 2.95652 19.1214 2.82892 19.0827 2.71317L18.3286 0.46739C18.2724 0.294754 18.1488 0.152185 17.9859 0.0721192Z" fill="black"/>
                                                    <path d="M10.1267 14.5911L2.78268 17.0527L2.02897 14.8056C1.96917 14.6267 1.77564 14.5301 1.5967 14.5899C1.41776 14.6497 1.32119 14.8432 1.38099 15.0222L2.13367 17.2673C2.18946 17.4396 2.31243 17.5821 2.47472 17.6625C2.56914 17.7095 2.67313 17.734 2.77859 17.7341C2.8519 17.7342 2.92476 17.7227 2.99447 17.7L10.3406 15.238C10.5195 15.1781 10.616 14.9845 10.5561 14.8056C10.4962 14.6267 10.3026 14.5302 10.1237 14.5901L10.1267 14.5911Z" fill="black"/>
                                                    <path d="M11.2547 7.67399C11.2547 7.86235 11.4074 8.01504 11.5958 8.01504C11.7841 8.01504 11.9368 7.86235 11.9368 7.67399C11.9039 6.90951 11.3303 6.27729 10.5726 6.17033V6.13929C10.5726 5.95094 10.4199 5.79825 10.2316 5.79825C10.0432 5.79825 9.89054 5.95094 9.89054 6.13929V6.17033C9.13286 6.27729 8.55929 6.90951 8.52637 7.67399C8.55929 8.43848 9.13286 9.0707 9.89054 9.17766V10.8614C9.51102 10.7753 9.23342 10.4497 9.20846 10.0613C9.20846 9.87295 9.05577 9.72026 8.86741 9.72026C8.67906 9.72026 8.52637 9.87295 8.52637 10.0613C8.55929 10.8258 9.13286 11.458 9.89054 11.565V11.596C9.89054 11.7844 10.0432 11.937 10.2316 11.937C10.4199 11.937 10.5726 11.7844 10.5726 11.596V11.565C11.3303 11.458 11.9039 10.8258 11.9368 10.0613C11.9039 9.29682 11.3303 8.6646 10.5726 8.55764V6.8739C10.9522 6.96 11.2298 7.28562 11.2547 7.67399ZM9.20846 7.67399C9.23342 7.28562 9.51102 6.96 9.89054 6.8739V8.47408C9.51102 8.38798 9.23342 8.06236 9.20846 7.67399ZM11.2547 10.0613C11.2298 10.4497 10.9522 10.7753 10.5726 10.8614V9.26121C10.9522 9.34731 11.2298 9.67293 11.2547 10.0613Z" fill="black"/>
                                                    <path d="M17.3928 12.6191H18.757C18.9453 12.6191 19.098 12.4665 19.098 12.2781V10.9139C19.098 10.7256 18.9453 10.5729 18.757 10.5729C18.5686 10.5729 18.4159 10.7256 18.4159 10.9139V11.9371H17.3928C17.2044 11.9371 17.0518 12.0897 17.0518 12.2781C17.0518 12.4665 17.2044 12.6191 17.3928 12.6191Z" fill="black"/>
                                                    <path d="M1.7053 10.5729C1.51695 10.5729 1.36426 10.7256 1.36426 10.9139V12.2781C1.36426 12.4665 1.51695 12.6191 1.7053 12.6191H3.06948C3.25783 12.6191 3.41052 12.4665 3.41052 12.2781C3.41052 12.0897 3.25783 11.9371 3.06948 11.9371H2.04635V10.9139C2.04635 10.7256 1.89366 10.5729 1.7053 10.5729Z" fill="black"/>
                                                    <path d="M3.06948 5.11618H1.7053C1.51695 5.11618 1.36426 5.26887 1.36426 5.45722V6.8214C1.36426 7.00976 1.51695 7.16245 1.7053 7.16245C1.89366 7.16245 2.04635 7.00976 2.04635 6.8214V5.79827H3.06948C3.25783 5.79827 3.41052 5.64558 3.41052 5.45722C3.41052 5.26887 3.25783 5.11618 3.06948 5.11618Z" fill="black"/>
                                                    <path d="M17.3928 5.79827H18.4159V6.8214C18.4159 7.00976 18.5686 7.16245 18.757 7.16245C18.9453 7.16245 19.098 7.00976 19.098 6.8214V5.45722C19.098 5.26887 18.9453 5.11618 18.757 5.11618H17.3928C17.2044 5.11618 17.0518 5.26887 17.0518 5.45722C17.0518 5.64558 17.2044 5.79827 17.3928 5.79827Z" fill="black"/>
                                                    </svg>
                                                    Cash on Delivery</div><h6>Only Available on home Delivery</h6></a>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                <div class="col-md-7">
                                    <div class="tab-content account dashboard-content pr-30">
                                        <div class="tab-pane fade active show" id="upi" role="tabpanel" aria-labelledby="upi-tab">
                                            <div class="upi-div">
                                                <ul class="upi-list">
                                                    <li class="active"><img src="assets/imgs/icons/gpay.svg" alt=""></li>
                                                    <li><img src="assets/imgs/icons/paytm.svg" alt=""></li>
                                                    <li><img src="assets/imgs/icons/phonepay.svg" alt=""></li>
                                                </ul>
                                                <div class="form-group">
                                                    <label>UPI ID</label>
                                                    <input type="text" class="form-control" placeholder="Enter UPI ID">
                                                </div>
                                                <button class="submit-btn">Pay Now</button>
                                            </div>
                                        </div>
                                        <div class="tab-pane fade" id="credit" role="tabpanel" aria-labelledby="credit-tab">
                                            <div class="credit-div">
                                                <h5>Add a New Card</h5>
                                                <div class="row">
                                                    <div class="col-md-12">
                                                        <div class="form-group">
                                                            <label>Card Number</label>
                                                            <input type="text" class="form-control" placeholder="Enter Card Number">
                                                        </div>
                                                    </div>
                                                    <div class="col-md-12">
                                                        <div class="form-group">
                                                            <label>Name on Card</label>
                                                            <input type="text" class="form-control" placeholder="Enter Name on Card">
                                                        </div>
                                                    </div>
                                                    <div class="col-xl-5 col-lg-7">
                                                        <div class="form-group">
                                                            <label>Expiry MM/YY</label>
                                                            <input type="date" class="form-control" placeholder="Enter Card Number">
                                                        </div>
                                                    </div>
                                                    <div class="col-xl-4 col-lg-5">
                                                        <div class="form-group">
                                                            <label>CVV</label>
                                                            <input type="text" class="form-control" placeholder="Enter CVV">
                                                        </div>
                                                    </div>
                                                    <div class="col-md-12">
                                                        <div class="form-group">
                                                            <div class="default-shipping">
                                                                <div class="custome-checkbox">
                                                                    <input class="form-check-input" type="checkbox" name="checkbox" id="exampleCheckbox16" value="">
                                                                    <label class="form-check-label" for="exampleCheckbox16"><span>Save this card for future transactions.</span></label>
                                                                </div>
                                                              
                                                            </div>
                                                        </div>
                                                        
                                                    </div>
                                                    <div class="col-md-12 mt-2">
                                                        <button class="submit-btn">Pay Now</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                    </div>
                                </div>
                            </div>
                            
                         </div>
                        </div>
                       
                        <div class="col-md-5">
                            <div class="shipping-addrss">
                                <h4 class="mb-0">Order Summary <a href="#" id="toggleDetailsBtn">Hide Details</a></h4>
                                <div class="order-list-div" id="order-list-div">
                                    <div class="order-list-single">
                                        <div class="order-img">
                                            <img src="assets/imgs/shop/pr1.jpg" alt="">
                                        </div>
                                        <div class="order-details">
                                            <h5>Jack & Jones Men Solid Bomber jacket</h5>
                                            <h4>400 SAR <span>Qty: 1</span></h4>
                                        </div>
                                    </div>
                                    <div class="order-list-single">
                                        <div class="order-img">
                                            <img src="assets/imgs/shop/prdct4.jpg" alt="">
                                        </div>
                                        <div class="order-details">
                                            <h5>Business Card</h5>
                                            <h4>200 SAR <span>Qty: 1</span></h4>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="shipping-addrss">
                                <h4>Billing Summary</h4>
                                <div class="billing-sum">
                                    <div class="form-group">
                                        <label>Promo Code</label>
                                        <div class="promo-coupn">
                                            <input type="text" class="form-control" placeholder="Enter Promo Code">
                                            <button class="check-btn">Apply</button>
                                        </div>
                                    </div>
                                    <hr>
                                    <div class="bill-sums">
                                        <div class="single-bill">Total MRP <span class="total-sub">827 SAR</span></div>
                                        <div class="single-bill">Offer Discount <span class="green-price">- 210 SAR</span></div>
                                        <div class="single-bill">Shipping & Convenience Fee <span class="green-price">Free</span></div>
                                        <hr>
                                        <div class="total-price">Total <span>617 SAR</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>
    
                    </div>
                </div>
                
            </section>

    
    </main>

    <?php include 'footer.php';?>
    <!-- Preloader Start -->
    <div id="preloader-active">
        <div class="preloader d-flex align-items-center justify-content-center">
            <div class="preloader-inner position-relative">
                <div class="text-center">
                    <img src="assets/imgs/theme/loading.gif" alt="" />
                </div>
            </div>
        </div>
    </div>
    <!-- Vendor JS-->
    <script src="https://kit.fontawesome.com/16b0815225.js" crossorigin="anonymous"></script>
    <script src="assets/js/vendor/jquery-3.6.0.min.js"></script>
    <script src="assets/js/vendor/bootstrap.bundle.min.js"></script>
    <script src="assets/js/plugins/slick.js"></script>
    <script src="assets/js/plugins/wow.js"></script>
    <script src="assets/js/plugins/magnific-popup.js"></script>
    <script src="assets/js/script.js"></script>
    <script>
        $(document).ready(function () {
            $('.customer-logos').slick({
                slidesToShow: 8,
                slidesToScroll: 1,
                autoplay: true,
                autoplaySpeed: 1500,
                arrows: false,
                dots: false,
                pauseOnHover: false,
                responsive: [{
                    breakpoint: 1200,
                    settings: {
                        slidesToShow: 5
                    }
                },{
                    breakpoint: 768,
                    settings: {
                        slidesToShow: 4
                    }
                }, {
                    breakpoint: 520,
                    settings: {
                        slidesToShow: 3
                    }
                }]
            });
        });
    </script>


<script>
    $(document).ready(function() {
      $('.upi-list li').on('click', function() {
        $('.upi-list li').removeClass('active');
        $(this).addClass('active');
      });
    });
  </script>
 <script>
    $(document).ready(function() {
      $('#toggleDetailsBtn').on('click', function() {
        $('#order-list-div').toggle();
        const buttonText = $('#order-list-div').is(':visible') ? 'Hide Details' : 'Show Details';
        $('#toggleDetailsBtn').text(buttonText);
      });
    });
  </script>
    <script>
    $(document).ready(function () {
        $("body").prepend('<div class="body-overlay-1"></div>');

        $(".burger-icon").on("click", function (e) {
            
            e.preventDefault();
            $(".mobile-header-active").addClass("sidebar-visible");
            $("body").addClass("mobile-menu-active");
        });

        $(".mobile-menu-close").on("click", function () {
            $(".mobile-header-active").removeClass("sidebar-visible");
            $("body").removeClass("mobile-menu-active");
        });

        $(".body-overlay-1").on("click", function () {
            $(".mobile-header-active").removeClass("sidebar-visible");
            $("body").removeClass("mobile-menu-active");
        });
    });
</script>
<script>
        var $offCanvasNav = $(".mobile-menu"),
        $offCanvasNavSubMenu = $offCanvasNav.find(".dropdown");

    /*Add Toggle Button With Off Canvas Sub Menu*/
    $offCanvasNavSubMenu.parent().prepend('<span class="menu-expand"><i class="fi-rs-angle-small-down"></i></span>');

    /*Close Off Canvas Sub Menu*/
    $offCanvasNavSubMenu.slideUp();

    /*Category Sub Menu Toggle*/
    $offCanvasNav.on("click", "li a, li .menu-expand", function (e) {
        var $this = $(this);
        if (
            $this
                .parent()
                .attr("class")
                .match(/\b(menu-item-has-children|has-children|has-sub-menu)\b/) &&
            ($this.attr("href") === "#" || $this.hasClass("menu-expand"))
        ) {
            e.preventDefault();
            if ($this.siblings("ul:visible").length) {
                $this.parent("li").removeClass("active");
                $this.siblings("ul").slideUp();
            } else {
                $this.parent("li").addClass("active");
                $this.closest("li").siblings("li").removeClass("active").find("li").removeClass("active");
                $this.closest("li").siblings("li").find("ul:visible").slideUp();
                $this.siblings("ul").slideDown();
            }
        }
    });
</script>
</body>

</html>