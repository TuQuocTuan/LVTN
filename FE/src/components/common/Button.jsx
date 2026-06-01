//Cấu hình cho các nút 
import React from 'react';

const Button = ({ children, variant = 'primary', onClick, className = '', ...props }) => {
    const baseStyle = "w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 active:scale-95 flex items-center justify-center gap-2";

    const variants = {
        primary: "bg-primary text-white hover:bg-secondary shadow-lg shadow-primary/20",
        secondary: "bg-secondary text-white hover:bg-opacity-90",
        outline: "border-2 border-neutralCustom text-neutralCustom hover:bg-neutralCustom/5",
        inverted: "bg-neutralCustom text-white hover:bg-opacity-90"
    };

    return (
        <button
            className={`${baseStyle} ${variants[variant]} ${className}`}
            onClick={onClick}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;