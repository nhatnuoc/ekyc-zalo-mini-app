import { Button } from "zmp-ui";
import resultError from '@/assets/result-error.svg'

const FailedView = ({
    title = "Đăng ký không thành công",
    message = "Chúng tôi rất tiếc về sự bất tiện này. Vui lòng thử lại.", 
    onClose, onTryAgain
}: {
    title?: string;
    message?: string;
    onClose?: () => void;
    onTryAgain?: () => void;
}) => (
    <div className="flex w-full">
        <div className="flex flex-col items-center justify-center w-full">
            <img src={resultError}/>
            <div className="text-xl text-neutral-900 font-bold">
                {title}
            </div>
            <div className="text-sm text-neutral-900">
                {message}
            </div>
            <Button fullWidth className="bg-primary text-neutral-900 text-sm mt-20" onClick={onTryAgain}>Thử lại</Button>
            <Button fullWidth className="bg-neutral-200 text-neutral-900 text-sm mt-2" onClick={onClose}>Đóng</Button>
        </div>
    </div>
)

export default FailedView