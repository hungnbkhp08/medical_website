import React from 'react'
import { assets } from '../assets/assets'

const Footer = () => {
    return (
        <div className='md:mx-10'>
            <div className='flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm'>
                {/*...LeftSection....*/}
                <div>
                    <img className='mb=5 w-40' src={assets.logo} alt="" />
                    <p className='w-full md:w-2/3 text-gray-600 leading-6'> Hello nao sửa thông tin mô tả vào đây</p>
                </div>
                {/*...CenterSection....*/}
                <div>
                    <p className='text-xl font-medium mb-5'>COMPANY</p>
                    <ul className='flex flex-col gap-2 text-gray-600'>
                        <li>Home</li>
                        <li>About us</li>
                        <li>Contact us</li>
                        <li>Privacy polocy</li>
                    </ul>
                </div>
                {/*...RightSection....*/}
                <div>
                    <p className='text-xl font-medium mb-5'> GET IT TOUCH</p>
                    <ul className='flex flex-col gap-2 text-gray-600'>
                        <li>0368874207</li>
                        <li>hungdepzaihehe@gmail.com</li>
                    </ul>
                </div>
            </div>
            <div>
                {/* Copyright text */}
                <hr/>
                <p className='py-5 text-sm text-center'>Copyright 2024@Prescripto -All Right Reserved</p>
            </div>
        </div>
    )
}

export default Footer