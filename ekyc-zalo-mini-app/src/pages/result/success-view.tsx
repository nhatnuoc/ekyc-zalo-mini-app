import { Button } from "zmp-ui";
import resultError from '@/assets/result-error.svg'
import resultSuccess from '@/assets/result-success.svg'

const SuccessView = ({
    title = "Đăng ký thành công",
    message = "Thông tin sinh trắc học của bạn đã được cập nhật thành công.", 
    onComplete
}: {
    title?: string;
    message?: string;
    onComplete?: () => void;
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
            <Button fullWidth className="text-sm mt-20" onClick={onComplete} variant="primary">Hoàn thành</Button>
        </div>
    </div>
)

export default SuccessView