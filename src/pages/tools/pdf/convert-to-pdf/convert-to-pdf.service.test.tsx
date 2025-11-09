import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ConvertToPdf from './index';
import { vi } from 'vitest';
import * as service from './service';
import '@testing-library/jest-dom';

describe('ConvertToPdf', () => {
  it('renders with default state values (full size, portrait hidden, no scale shown)', () => {
    render(<ConvertToPdf title="Test PDF" />);

    expect(screen.getByLabelText(/Full Size \(Same as Image\)/i)).toBeChecked();

    expect(screen.queryByLabelText(/A4 Page/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Portrait/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Scale image:/i)).not.toBeInTheDocument();
  });

  it('switches to A4 page type and shows orientation and scale', () => {
    render(<ConvertToPdf title="Test PDF" />);

    const a4Option = screen.getByLabelText(/A4 Page/i);
    fireEvent.click(a4Option);
    expect(a4Option).toBeChecked();

    expect(screen.getByLabelText(/Portrait/i)).toBeChecked();
    expect(screen.getByText(/Scale image:\s*100%/i)).toBeInTheDocument();
  });

  it('updates scale when slider moves (after switching to A4)', () => {
    render(<ConvertToPdf title="Test PDF" />);

    fireEvent.click(screen.getByLabelText(/A4 Page/i));

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: 80 } });

    expect(screen.getByText(/Scale image:\s*80%/i)).toBeInTheDocument();
  });

  it('hides A4-only controls when switching back to Fullsize', () => {
    render(<ConvertToPdf title="Test PDF" />);
    fireEvent.click(screen.getByLabelText(/A4 Page/i));
    expect(screen.getByLabelText(/Portrait/i)).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/Full Size/i));
    expect(screen.queryByLabelText(/Portrait/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Scale image:/i)).not.toBeInTheDocument();
  });

  it('respects scale boundaries 10..100', () => {
    render(<ConvertToPdf title="Test PDF" />);
    fireEvent.click(screen.getByLabelText(/A4 Page/i));

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: 5 } });
    expect(screen.getByText(/Scale image:\s*10%/i)).toBeInTheDocument();
  });

  it('buildPdf can be replaced by a fake that returns fixed pdf', async () => {
    vi.spyOn(service, 'buildPdf').mockResolvedValue({
      pdfFile: new File(['fake-pdf'], 'fake.pdf', { type: 'application/pdf' }),
      imageSize: { widthMm: 200, heightMm: 100, widthPx: 800, heightPx: 400 }
    });

    const result = await service.buildPdf({
      file: new File(['img'], 'img.jpg', { type: 'image/jpeg' }),
      pageType: 'a4',
      orientation: 'portrait',
      scale: 100
    });

    expect(result.pdfFile.name).toBe('fake.pdf');
    expect(result.imageSize.widthMm).toBe(200);
  });
});
