import React from 'react'
import Header from '../components/Header'
import SpecialityMenu from '../components/SpecialityMenu'
import TopDoctors from '../components/TopDoctors'
import Banner from '../components/Banner'

const Home = () => {
    return (
        <div>
            <Header/>
            <SpecialityMenu/>
            <TopDoctors/>
            <Banner/>
            
            {/* Google Map section */}
            <div className="w-full h-[500px] my-10 px-5">
                <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3725.2948096523846!2d105.79365357596889!3d20.980816389422294!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135acc508f938fd%3A0x883e474806a2d1f2!2zSOG7jWMgdmnhu4duIEvhu7kgdGh14bqtdCBt4bqtdCBtw6M!5e0!3m2!1svi!2s!4v1754028260119!5m2!1svi!2s"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Google Map Location"
                />
            </div>
        </div>
    )
}

export default Home